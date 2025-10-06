terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "dubai-real-estate-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "me-central-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Dubai Real Estate Platform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  db_instance_class       = var.db_instance_class
  db_allocated_storage    = var.db_allocated_storage
  db_engine_version       = var.db_engine_version
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  multi_az                = var.environment == "production" ? true : false
  backup_retention_period = var.environment == "production" ? 7 : 1
}

# OpenSearch Domain
module "opensearch" {
  source = "./modules/opensearch"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  instance_type       = var.opensearch_instance_type
  instance_count      = var.opensearch_instance_count
  ebs_volume_size     = var.opensearch_ebs_volume_size
  master_user_name    = var.opensearch_master_user
  master_user_password = var.opensearch_master_password
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  public_subnet_ids   = module.vpc.public_subnet_ids
  task_cpu            = var.ecs_task_cpu
  task_memory         = var.ecs_task_memory
  desired_count       = var.ecs_desired_count
  container_image     = var.container_image
  db_host             = module.rds.db_endpoint
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password
  opensearch_endpoint = module.opensearch.endpoint
  jwt_secret          = var.jwt_secret
}

# S3 Buckets for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "dubai-real-estate-uploads-${var.environment}"
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/ecs/dubai-real-estate-${var.environment}"
  retention_in_days = var.environment == "production" ? 30 : 7
}

# ECR Repository
resource "aws_ecr_repository" "backend" {
  name                 = "dubai-real-estate-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Outputs
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "VPC ID"
}

output "rds_endpoint" {
  value       = module.rds.db_endpoint
  description = "RDS endpoint"
  sensitive   = true
}

output "opensearch_endpoint" {
  value       = module.opensearch.endpoint
  description = "OpenSearch endpoint"
  sensitive   = true
}

output "ecs_cluster_name" {
  value       = module.ecs.cluster_name
  description = "ECS cluster name"
}

output "load_balancer_dns" {
  value       = module.ecs.load_balancer_dns
  description = "Load balancer DNS name"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.uploads.id
  description = "S3 bucket name for uploads"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR repository URL"
}

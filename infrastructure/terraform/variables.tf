variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "me-central-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["me-central-1a", "me-central-1b"]
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "real_estate_prod"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# OpenSearch Configuration
variable "opensearch_instance_type" {
  description = "OpenSearch instance type"
  type        = string
  default     = "t3.medium.search"
}

variable "opensearch_instance_count" {
  description = "Number of OpenSearch instances"
  type        = number
  default     = 2
}

variable "opensearch_ebs_volume_size" {
  description = "EBS volume size for OpenSearch in GB"
  type        = number
  default     = 100
}

variable "opensearch_master_user" {
  description = "OpenSearch master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "opensearch_master_password" {
  description = "OpenSearch master password"
  type        = string
  sensitive   = true
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "container_image" {
  description = "Docker container image"
  type        = string
}

# Application Configuration
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

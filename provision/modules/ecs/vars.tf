variable "project_name" {
  type = string
}

variable "project_environment" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_cidr" {
  description = "CIDR range"
  type = string
  default = "10.0.0.0/16"
}
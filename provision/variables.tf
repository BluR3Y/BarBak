variable "profile" {
  description = "AWS profile"
  type = string
}

variable "region" {
  description = "AWS region to deploy to"
  type = string
}

variable "project_name" {
  description = "Name of project"
  type = string
}

variable "project_environment" {
  description = "Type of project environment, i.e, development, test, production"
  type = string
}
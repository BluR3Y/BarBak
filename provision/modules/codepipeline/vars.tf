variable "project_name" {
  description = "Name of project"
  type = string
}

variable "project_environment" {
  description = "Type of project environment, i.e, development, test, production"
  type = string
}

variable "region" {
  type = string
}

variable "repo_path" {
  description = "The owner and name of the repository where source changes are to be detected"
  type = string
}

variable "repo_branch" {
  description = "Github repository branch where source changes are to be detected"
  type = string
}

variable "codebuild_name" {
  description = "Codebuild project name"
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}
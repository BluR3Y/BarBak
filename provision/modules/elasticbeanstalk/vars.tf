variable "project_name" {
  type = string
}

variable "project_environment" {
  type = string
}

variable "project_description" {
  type = string
}

variable "instance_types" {
  type = string
  default = "t2.medium,t3.medium"
}
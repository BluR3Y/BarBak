# https://registry.terraform.io/providers/hashicorp/aws/latest

terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.41.0"
    }
  }
}

provider "aws" {
    profile = var.profile
    region = var.region
    shared_credentials_files = ["~/.aws/credentials"]
}
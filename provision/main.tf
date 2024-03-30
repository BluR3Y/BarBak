# CodeBuild module for CI
module "codebuild_for_barbak_app" {
  source = "./modules/codebuild"
  project_name = var.project_name
  project_environment = var.project_environment
}

# CodePipeline module for CICD pipeline
module "codepipeline_for_barbak_app" {
  source = "./modules/codepipeline"
  region = var.region
  project_name = var.project_name
  project_environment = var.project_environment
  repo_path = "BluR3Y/BarBak"
  repo_branch = "development"
  codebuild_name = module.codebuild_for_barbak_app.project_name
}

# Elastic Beanstalk module for application
module "elasticbeanstalk_for_barbak_app" {
  source = "./modules/elasticbeanstalk"
  project_name = var.project_name
  project_environment = var.project_environment
  project_description = ""
}
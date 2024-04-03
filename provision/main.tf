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
  repo_branch = "development" // Temporary, revert to: main
  codebuild_name = module.codebuild_for_barbak_app.project_name
  ecs_cluster_name = module.ecs_for_barbak_app.ecs_cluster_name
  ecs_service_name = module.ecs_for_barbak_app.ecs_service_name
}

module "ecs_for_barbak_app" {
  source = "./modules/ecs"
  project_name = var.project_name
  project_environment = var.project_environment
  region = var.region
}
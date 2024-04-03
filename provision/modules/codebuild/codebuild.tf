resource "aws_codebuild_project" "main" {
  name = "${var.project_name}-${var.project_environment}-build"
  service_role = aws_iam_role.main.arn
  build_timeout = 10

  artifacts {
    type = "CODEPIPELINE"
  }

  #cache {
  #  type = "S3"
  #  location = "${var.bucket_name}/${var.name}/build_cache"
  #}

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode = true

    environment_variable {
      name = "PROJECT_NAME"
      value = var.project_name
    }

    environment_variable {
      name = "STAGE_NAME"
      value = var.project_environment
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }
}

# Resources:
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/codebuild_project
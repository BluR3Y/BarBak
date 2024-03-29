resource "aws_codepipeline" "main" {
  name = "${var.project_name}-${var.project_environment}-pipeline"
  role_arn = aws_iam_role.main.arn

  artifact_store {
    location = aws_s3_bucket.main.bucket
    type = "S3"
  }

  stage {
    name = "Source"

    action {
      name = "SourceAction"
      category = "Source"
      owner = "AWS"
      provider = "CodeStarSourceConnection"
      version = "1"
      output_artifacts = ["SourceArtifact"]

      configuration = {
        ConnectionArn = aws_codestarconnections_connection.main.arn
        FullRepositoryId = var.repo_path
        BranchName = var.repo_branch
        DetectChanges = "true"
      }
      run_order = 1
    }
  }

  stage {
    name = "Build"

    action {
      name = "BuildAction"
      category = "Build"
      owner = "AWS"
      provider = "CodeBuild"
      input_artifacts = ["SourceArtifact"]
      output_artifacts = ["BuildArtifact"]
      version = "1"

      configuration = {
        ProjectName = "barbak-development-build"  // temp
        PrimarySource = "SourceArtifact"
      }
      run_order = 2
    }
  }

  # stage {
  #   name = "Deploy"

  #   action {
  #     name = "DeployAction"
  #     category = "Deploy"
  #     owner = "AWS"
  #     provider = "CodeDeploy"
  #     input_artifacts = ["BuildArtifact"]
  #     version = "1"

  #     configuration = {
  #       ApplicationName = ""  // temp
  #     }
  #     run_order = 3
  #   }
  # }
}

# Resources:
  # https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference.html

  # https://stackoverflow.com/questions/25956193/difference-between-amazon-ec2-and-aws-elastic-beanstalk
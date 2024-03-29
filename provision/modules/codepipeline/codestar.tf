resource "aws_codestarconnections_connection" "main" {
  name = "${var.project_name}-github-connection"
  provider_type = "GitHub"
}

# Resources:
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/codestarconnections_connection
    # https://docs.aws.amazon.com/dtconsole/latest/userguide/connections-update.html
    # https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodestarConnectionSource.html
resource "aws_elastic_beanstalk_application" "main" {
  name = "${var.project_name}-application"
  description = var.project_description
}

resource "aws_elastic_beanstalk_configuration_template" "main" {
  name = "${var.project_name}-${var.project_environment}-template-config"
  application = aws_elastic_beanstalk_application.main.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.0.6 running ECS"
}

# resource "aws_elastic_beanstalk_environment" "main" {
#   name = "${var.project_name}-${var.project_environment}-beanstalk-environment"
#   application = aws_elastic_beanstalk_application.main.name
#   solution_stack_name = "64bit Amazon Linux 2023 v4.0.6 running ECS"
#   tier = "WebServer"

#   setting {
#     namespace = "aws:ec2:instances"
#     name = "InstanceTypes"
#     value = "t2.micro"
#   }
# }

# Resources:
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/elastic_beanstalk_application
    # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.platforms.html
    # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker.html
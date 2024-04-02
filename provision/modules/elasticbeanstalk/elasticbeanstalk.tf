resource "aws_elastic_beanstalk_application" "main" {
  name = "${var.project_name}-application"
  description = var.project_description
}

resource "aws_elastic_beanstalk_configuration_template" "main" {
  name = "${var.project_name}-${var.project_environment}-template-config"
  application = aws_elastic_beanstalk_application.main.name
  solution_stack_name = "64bit Amazon Linux 2 v3.8.0 running Docker"

  setting {
    namespace = "aws:ec2:instances"
    name = "InstanceTypes"
    value = var.instance_types
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name = "IamInstanceProfile"
    value = aws_iam_instance_profile.main.arn
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name = "MinSize"
    value = "1"
  }
}

resource "aws_elastic_beanstalk_environment" "main" {
  name = "${var.project_name}-${var.project_environment}-beanstalk-environment"
  application = aws_elastic_beanstalk_application.main.name
  template_name = aws_elastic_beanstalk_configuration_template.main.name
  cname_prefix = "${var.project_name}-${var.project_environment}-environment"
  tier = "WebServer"
  wait_for_ready_timeout = "40m"

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name = "EnvironmentType"
    value = "SingleInstance"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name = "ServiceRole"
    value = aws_iam_role.main.arn
  }
}

# Resources:
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/elastic_beanstalk_application
    # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker.html

    # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.platforms.html
    # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker.html
    # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
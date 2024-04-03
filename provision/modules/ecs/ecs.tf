resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-ecs-cluster"
}

resource "aws_ecs_capacity_provider" "main" {
  name = "${var.project_name}-ecs-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.main.arn

    managed_scaling {
      maximum_scaling_step_size = 1000
      minimum_scaling_step_size = 1
      status = "ENABLED"
      target_capacity = 3
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name
  capacity_providers = [ aws_ecs_capacity_provider.main.name ]
  default_capacity_provider_strategy {
    base = 1
    weight = 100
    capacity_provider = aws_ecs_capacity_provider.main.name
  }
}

resource "aws_ecs_service" "main" {
  name = "${var.project_name}-ecs-service"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count = 2

  network_configuration {
    subnets = [aws_subnet.subnet_one.id, aws_subnet.subnet_two.id]
    security_groups = [aws_security_group.main.id]
  }

  force_new_deployment = true
  placement_constraints {
    type = "distinctInstance"
  }

  triggers = {
    redeployment = timestamp()
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.main.name
    weight = 100
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name = "webserver"
    container_port = 80
  }
  
  depends_on = [ aws_autoscaling_group.main ]
}

# Resources:
    # https://spacelift.io/blog/terraform-ecs
    # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html
    # https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/networking-networkmode.html
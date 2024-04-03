# EC2 launch template
resource "aws_launch_template" "main" {
  name_prefix = "${var.project_name}-ecs-template"
  image_id = "ami-0c101f26f147fa7fd"
  instance_type = "t3.micro"

  # Missing: Key configuration for SSH access

  vpc_security_group_ids = [ aws_security_group.main.id ]
  iam_instance_profile {
    name = "ecsInstanceRole"
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
        volume_size = 30
        volume_type = "gp2"
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "ecs-instance"
    }
  }

  user_data = base64encode(
    <<-EOF
      #!/bin/bash
      echo ECS_CLUSTER=${var.project_name}-ecs-cluster >> /etc/ecs/ecs.config
    EOF
  )
}

# Auto-Scaling Group
resource "aws_autoscaling_group" "main" {
  vpc_zone_identifier = [aws_subnet.subnet_one.id, aws_subnet.subnet_two.id]
  desired_capacity = 2
  max_size = 3
  min_size = 1

  launch_template {
    id = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key = "AmazonECSManaged"
    value = true
    propagate_at_launch = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name = "${var.project_name}-ecs-load-balancer"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.main.id]
  subnets = [aws_subnet.subnet_one.id, aws_subnet.subnet_two.id]

  tags = {
    Name = "ecs-alb"
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port = 80
  protocol = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_lb_target_group" "main" {
  name = "${var.project_name}-ecs-target-group"
  port = 80
  protocol = "HTTP"
  target_type = "ip"
  vpc_id = aws_vpc.main.id

  health_check {
    path = "/"
  }
}

# Resources:
    # https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html
    # https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html
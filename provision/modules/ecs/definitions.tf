resource "aws_ecs_task_definition" "main" {
  family = "${var.project_name}-ecs-task"
  requires_compatibilities = [ "EC2" ]
  network_mode = "awsvpc"
  # execution_role_arn = "arn:aws:iam::532199187081:role/ecsTaskExecutionRole"
  cpu = 256
  memory = 512
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture = "X86_64"
  }

  container_definitions = jsonencode([
    {
      "name": "mysql",
      "image": "mysql:latest",
      "essential": false,
      "memory": 512,
      "mountPoints": [
        {
          "sourceVolume": "mysql-init",
          "containerPath": "/docker-entrypoint-initdb.d",
          "readOnly": true
        }
      ]
    },
    {
      "name": "redis",
      "image": "redis:latest",
      "essential": false,
      "memory": 300
    },
    {
      "name": "backend",
      "image": "reyhec/barbak-${var.project_environment}-backend:latest",
      "essential": false,
      "memory": 300
    },
    {
      "name": "client",
      "image": "reyhec/barbak-${var.project_environment}-client:latest",
      "essential": false,
      "memory": 300,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_BACKEND_URL",
          "value": "http://localhost:3000"
        }
      ]
    },
    {
      "name": "webserver",
      "image": "reyhec/barbak-${var.project_environment}-webserver:latest",
      "essential": true,
      "memory": 100,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 80
          "protocol": "tcp"
        }
      ],
    }
  ])

  volume {
    name = "mysql-init"
    host_path = "/var/app/current/database/mysql/init"
  }
}

# Resources:
  # https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/networking-networkmode.html
  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html
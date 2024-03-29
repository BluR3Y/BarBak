resource "aws_s3_bucket" "main" {
  force_destroy = true
  bucket = "${var.project_name}-${var.project_environment}-pipeline-artifacts"

    tags = {
      Project = var.project_name
      Environment = var.project_environment
    }
}

resource "aws_s3_bucket_ownership_controls" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "main" {
  depends_on = [ aws_s3_bucket_ownership_controls.main ]

  bucket = aws_s3_bucket.main.id
  acl = "private"
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Resources:
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_acl
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_versioning
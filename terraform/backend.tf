# Terraform Backend Configuration
#
# This configuration uses a local backend, which is not recommended for production use.
# For production, you should use a remote backend like Azure Storage to store the state file.
#
# To use Azure Storage as a backend, uncomment the following lines and replace the values with your own.
#
terraform {
  backend "azurerm" {
    resource_group_name  = "ai-ocr"
    storage_account_name = "ai-ocr1"
    container_name       = "aiocr"
    key                  = "ai-foundry.tfstate"
  }
}

terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}

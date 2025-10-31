# Terraform Configuration Updates

## Summary

The Terraform configuration has been updated to include Azure Container Registry (ACR) creation, which was missing from the original setup.

## Changes Made

### 1. Added ACR Variable (`terraform/variables.tf`)
```hcl
variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "aifoundryacr"
}
```

### 2. Added ACR Resource (`terraform/main.tf`)
```hcl
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = false
}
```

### 3. Added ACR Outputs (`terraform/outputs.tf`)
```hcl
output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "acr_name" {
  value = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}
```

## Default Resource Names

When deployed with default Terraform variables, the following resources will be created:

| Resource Type | Name | GitHub Secret |
|---------------|------|---------------|
| Resource Group | `ai-foundry-rg` | `AZURE_RESOURCE_GROUP` |
| AKS Cluster | `ai-foundry-aks` | `AZURE_CLUSTER_NAME` |
| Container Registry | `aifoundryacr` | `ACR_NAME` |

## Deployment Instructions

### 1. Deploy Infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 2. Get Resource Names for GitHub Secrets
```bash
# Get the actual deployed resource names
terraform output resource_group_name
terraform output cluster_name
terraform output acr_name
```

### 3. Configure GitHub Secrets
Use the output values to configure your GitHub repository secrets:
- `AZURE_RESOURCE_GROUP`: Value from `terraform output resource_group_name`
- `AZURE_CLUSTER_NAME`: Value from `terraform output cluster_name`
- `ACR_NAME`: Value from `terraform output acr_name`

## ACR Configuration Notes

- **SKU**: Set to "Basic" for cost optimization (can be upgraded to Standard/Premium if needed)
- **Admin Enabled**: Set to `false` for security (uses Azure AD authentication instead)
- **Authentication**: The GitHub Actions workflow uses Azure CLI authentication with service principal

## Next Steps

1. Run `terraform apply` to create the ACR resource
2. Update your GitHub repository secrets with the actual resource names
3. Ensure your service principal has the required permissions on the ACR
4. Test the GitHub Actions workflow

## Required Service Principal Permissions

The service principal needs these additional permissions for ACR:
```bash
# Assign AcrPush role to the service principal
az role assignment create \
  --assignee {CLIENT_ID} \
  --role AcrPush \
  --scope /subscriptions/{subscription-id}/resourceGroups/{resource-group-name}/providers/Microsoft.ContainerRegistry/registries/{acr-name}
```
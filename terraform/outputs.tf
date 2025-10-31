output "cluster_name" {
  value = module.aks.cluster_name
}

output "kube_config" {
  value = module.aks.kube_config
  sensitive = true
}

output "vnet_id" {
  value = module.networking.vnet_id
}

output "aks_subnet_id" {
  value = module.networking.aks_subnet_id
}

output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "acr_name" {
  value = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

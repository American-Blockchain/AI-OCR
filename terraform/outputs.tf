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

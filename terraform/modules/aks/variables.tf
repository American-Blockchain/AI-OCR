variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "ai-foundry-aks"
}

variable "location" {
  description = "Azure region where resources will be deployed"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix for the AKS cluster"
  type        = string
  default     = "ai-foundry-aks"
}

variable "node_count" {
  description = "Number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

variable "aks_subnet_id" {
  description = "ID of the subnet for the AKS cluster"
  type        = string
}

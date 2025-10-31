variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "ai-foundry-rg"
}

variable "location" {
  description = "Azure region where resources will be deployed"
  type        = string
  default     = "West US"
}

variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
  default     = "ai-foundry-vnet"
}

variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "ai-foundry-aks"
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

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "aifoundryacr"
}

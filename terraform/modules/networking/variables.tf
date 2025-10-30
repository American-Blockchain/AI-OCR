variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
  default     = "ai-foundry-vnet"
}

variable "location" {
  description = "Azure region where resources will be deployed"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

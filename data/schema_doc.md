# Markdown Representation of the Schema

## ProductInstance

> Thing > Product > ProductInstance

A unique singular instance of a defined product.

| Property Name | Property Type | Property Description |
| --- | --- | --- |
| asset | Text | Asset number or identifier from this specific product instance. |
| serial | Text | Serial number for this product instance. |
| location | Place | Where the device is located. |

## ComputeDevice

> Thing > Product > ProductInstance > ComputeDevice

A singular device that does some type of computing. This could be a switch, laptop,
desktop, access point, server, monitor, etc. More specific types could be used
if they exist, otherwise this class may be more of a catch-all.

| Property Name | Property Type | Property Description |
| --- | --- | --- |
| hardware | ComputeHardware | A list of hardware that a compute device has. |
| operatingSystem | OperatingSystemEnumeration or Text | The operating system of the device |

## AccessPoint

> Thing > Product > ProductInstance > ComputeDevice > AccessPoint

An access-point device that provides wireless network access to clients.

## NetworkSwitch

> Thing > Product > ProductInstance > ComputeDevice > NetworkSwitch

A networking switch that provides wired network access to clients or server.

## PersonalComputer

A personal computer device, generally used by clients or end-users.

| Property Name | Property Type | Property Description |
| --- | --- | --- |
| deviceClass | PersonalComputerClass | The class of the device it is. |

## ComputeHardware

> Thing > ComputeHardware

The basis of computer hardware for any ComputeDevice. Used as the basis to
describe more complicated types of hardware.

| Property Name | Property Type | Property Description |
| --- | --- | --- |
| status | HardwareStatus | The current status of the hardware item. |

## NetworkInterface

> Thing > ComputeHardware > NetworkInterface

A networking interface.

| Property Name | Property Type | Property Description |
| --- | --- | --- |
| physicalAddress | Text | The MAC address. |
| dhcpEnabled | Boolean | If DHCP is enabled. |
| ipv4Address | Text | The IPv4 address. |
| ipv4SubnetMask | Text | The IPv4 Subnet Mask. |
| ipv4DefaultGateway | Text | The IPv4 Default Gateway. |
| ipv4DHCPServer | Text | The IPv4 DHCP server. |
| ipv4DNSServer | Text | The IPv4 DNS Server. |
| dhcpLeaseObtained | Date | When the DHCP lease was obtained. |
| dhcpLeaseExpires | Date | When the DHCP lease expires. |
| ipv6Address | Text | The IPv6 address. |
| ipv6SubnetPrefix | Text | The IPv6 subnet prefix length. |
| ipv6DefaultGateway | Text | The IPv6 Default Gateway. |
| ipv6DNSServer | Text | The IPv6 DNS Server. |
| speed | QuantitativeValue | The speed of the connection. |

## Graphics

> Thing > ComputerHardware > Graphics

A device providing graphical capabilities.

## Processor

> Thing > ComputerHardware > Processor

A device providing processing capabilities.

## RandomAccessMemory

> Thing > ComputerHardware > RandomAccessMemory

A device providing volatile memory access.

## PowerSupply

> Thing > ComputeHardware > PowerSupply

The device/method used to supply power to a compute device.

## Storage

> Thing > ComputeHardware > Storage

A device providing a storage interface.

## Motherboard

> Thing > ComputeHardware > Motherboard

The motherboard or mainboard of a compute device.

## HardwareStatus

> Thing > Intangible > Enumeration > StatusEnumeration > HardwareStatus

Status of a compute hardware device.

Enumeration members:
* Active: The device is active and functioning.
* Enabled: The device is enabled and functional, but not currently in use.
* Disabled: The device has been disabled.
* Broken: The device is non-functional.

## PersonalComputerClass

> Thing > Intangible > Enumeration > PersonalComputerClass

The class of a personal computer.

Enumeration members:
* Laptop: The device is a portable laptop.
* Desktop: The device is a stationary desktop.

## OperatingSystemEnumeration

> Thing > Intangible > Enumeration > OperatingSystemEnumeration

The platform's operating system.

Enumeration members:
* Windows
* Linux
* macOS
* Android
* iOS
* iPadOS

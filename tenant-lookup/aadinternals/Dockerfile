FROM mcr.microsoft.com/microsoftgraph/powershell:2.25.0

SHELL [ "pwsh", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'Continue'; $verbosePreference='Continue';" ]
RUN Set-PSRepository PSGallery -InstallationPolicy Trusted; Install-Module AADInternals, DnsClient-PS, Pode
RUN Get-Module AADInternals -ListAvailable | % { \
  Get-Content "$($_.ModuleBase)/AADInternals.psm1" | Select-String -SimpleMatch -NotMatch "System.Web.Extensions" | Set-Content "$($_.ModuleBase)/AADInternals.psm1" \
}

COPY . .

ENTRYPOINT [ "pwsh", "entrypoint.ps1" ]

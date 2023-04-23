$endpoint = "https://register.print.microsoft.com/api/v1.0/registerConnector"

Write-Host "Open this URL, login, and copy the code query string parameter"
Write-Host "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?scope=https://print.print.microsoft.com/.default openid profile offline_access&response_type=code&client_id=80331ee5-4436-4815-883e-93bc833a9a15&redirect_uri=https://universalprintconnector/&client_info=1"
$code = Read-Host "Authorization code"
$password = Read-Host "PFX password"

$res = Invoke-RestMethod "https://login.microsoftonline.com/common/oauth2/v2.0/token" -Method POST -Body @{
  client_id="80331ee5-4436-4815-883e-93bc833a9a15";
  client_info=1;
  scope="https://print.print.microsoft.com/.default+openid+profile+offline_access";
  grant_type="authorization_code";
  code=$code;
  redirect_uri="https://universalprintconnector/"
}
$token = ConvertTo-SecureString $res.access_token -AsPlainText -Force

$privateKey = New-Object System.Security.Cryptography.RSACng(2048)
$subject = [System.Security.Cryptography.X509Certificates.X500DistinguishedName]::new("CN=Microsoft, O=Microsoft Corp, L=Redmond, ST=Washington, C=US")
$certReq = New-Object System.Security.Cryptography.X509Certificates.CertificateRequest($subject, $privateKey, [System.Security.Cryptography.HashAlgorithmName]::Sha256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
$csr = $certReq.CreateSigningRequest()

$connector = Invoke-RestMethod $endpoint -Method POST -Authentication OAuth -Token $token -ContentType "application/json" -Body (@{
  name=$env:computername;
  hostname=$env:computername;
  os_version="bar";
  app_version="baz";
  device_id="$([guid]::NewGuid())_$($env:computername)";
  device_type="connector";
  certificate_request=@{
    type="pkcs10";
    data=[Convert]::ToBase64String($csr);
    transport_key=[Convert]::ToBase64String($privateKey.ExportRSAPublicKey())
  }
} | ConvertTo-Json)

$id = $connector.registration_id
do {
  sleep $connector.interval
  $connector = Invoke-RestMethod "$endpoint\?registration_id=$id" -Authentication OAuth -Token $token
} while ($connector.interval)

$connector.certificate > client.cer
$privateKey.ExportRSAPrivateKeyPem() > client.key
echo $password, $password | certutil -f -mergepfx client.cer client.pfx
rm client.cer, client.key

Write-Host DeviceTokenUrl:, $connector.device_token_url
Write-Host CloudDeviceId:, $connector.cloud_device_id

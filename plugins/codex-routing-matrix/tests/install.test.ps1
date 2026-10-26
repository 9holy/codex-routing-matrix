Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

function Set-ConflictingLunaProfile {
  param([string]$Source, [string]$Target)
  $text = [IO.File]::ReadAllText($Source, [Text.UTF8Encoding]::new($false))
  $text = $text.Replace('model = "gpt-6-luna"', 'model = "gpt-5.5"')
  [IO.File]::WriteAllText($Target, $text, [Text.UTF8Encoding]::new($false))
}

$pluginRoot = Split-Path -Parent $PSScriptRoot
$installScript = Join-Path $pluginRoot 'scripts/install.ps1'
$uninstallScript = Join-Path $pluginRoot 'scripts/uninstall.ps1'
$templateDir = Join-Path $pluginRoot 'templates/agents'
$lunaTemplate = Join-Path $templateDir 'luna-worker.toml'
$terraTemplate = Join-Path $templateDir 'terra-worker.toml'
$reviewerTemplate = Join-Path $templateDir 'sol-reviewer.toml'
$previousReviewer = @'
name = "sol_reviewer"
description = "Read-only reviewer for critical, high-risk changes."
model = "gpt-6.1-sol"
model_reasoning_effort = "xhigh"
sandbox_mode = "read-only"
developer_instructions = """
Review the declared outcome against its requirements and evidence, following affected callers and state transitions. Stay within that scope; do not turn it into a whole-repo audit. Do not modify files, perform production work, make the final decision, or delegate. Report findings first with precise paths; separate verified results from unverified assumptions.
"""
'@
$previousReviewer = $previousReviewer.Replace("`r`n", "`n") + "`n"
$previousManagedReviewer = $previousReviewer.Replace('Read-only reviewer for critical, high-risk changes.', 'Reviewer for critical changes; no-write duties under inherited host permissions.').Replace("sandbox_mode = `"read-only`"`n", '').Replace("`n`"`"`"`n", "`nRead-only duties are instructions, not sandbox enforcement. Custom agents inherit host permissions; do not claim write isolation without host-level runtime evidence.`n`"`"`"`n")
$previousTerraLatest = @'
name = "terra_worker"
description = "Bounded work with a clear task-specific advantage over Sol Medium or the current Lead."
model = "gpt-5.6-terra"
developer_instructions = """
Handle the assigned work packet strictly within its declared scope and selected reasoning effort. In normal mode, do not delegate. In Super mode, delegate only when the packet explicitly has burst_delegate=yes and burst_depth=d1, d2, or d3; d4 never delegates. Verify every acceptance criterion; if an acceptance criterion is impossible, report it instead of guessing. Return a concise result, paths, checks, and blockers.
"""
'@.Replace("`r`n", "`n") + "`n"
$previousTerraHistorical = $previousTerraLatest.Replace('Bounded work with a clear task-specific advantage over Sol Medium or the current Lead.', 'Worker for bounded, verifiable tasks that require deeper reasoning.')
$profileCount = @(Get-ChildItem -LiteralPath $templateDir -Filter '*.toml' -File).Count
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('codex-routing-matrix-install-' + [guid]::NewGuid().ToString('N'))

try {
  $freshHome = Join-Path $tempRoot 'fresh/.codex'
  $first = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True $first.Verified 'First install was not verified'
  Assert-True ($first.VerificationScope -ceq 'profile-contracts') 'Install verification scope was not limited to profile contracts'
  Assert-True ($first.ReviewerWriteIsolation -ceq 'NOT_VERIFIED') 'Install incorrectly claimed reviewer write isolation'
  Assert-True (@($first.Results | Where-Object { $_.Status -eq 'install' -and $_.Ownership -eq 'created' }).Count -eq $profileCount) 'First install did not own every created profile'
  Assert-True (Test-Path -LiteralPath (Join-Path $freshHome '.codex-routing-matrix.install-state.json')) 'First install did not write ownership state'
  Assert-True ($first.DefaultRules.Status -ceq 'created') 'First install did not create the default agent rules'
  Assert-True ($first.RoutingMatrix.Status -ceq 'appended') 'First install did not append the canonical routing matrix'
  $firstAgentsText = [IO.File]::ReadAllText((Join-Path $freshHome 'AGENTS.md'), [Text.UTF8Encoding]::new($false))
  Assert-True ($firstAgentsText.StartsWith('## Meta Rule - Conflict Resolution')) 'Default meta rule was not inserted at the beginning'
  Assert-True ($firstAgentsText.Contains('## Implementation')) 'Default implementation rule is missing'

  $second = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($second.Results | Where-Object { $_.Status -eq 'kept' -and $_.Ownership -eq 'created' }).Count -eq $profileCount) 'Second install did not retain ownership'
  Assert-True ($second.DefaultRules.Status -ceq 'skipped') 'Default rules were guarded after first install'
  Assert-True ($second.RoutingMatrix.Status -ceq 'kept') 'Second install did not retain the canonical routing matrix'

  $freshAgents = Join-Path $freshHome 'AGENTS.md'
  $legacyBrandRule = [IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false)).Replace('## Codex Routing Matrix - Default Multi-Model Quality Team', '## Codex Quality Routing - Default Multi-Model Quality Team')
  [IO.File]::WriteAllText($freshAgents, $legacyBrandRule, [Text.UTF8Encoding]::new($false))
  $brandMigration = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True ($brandMigration.RoutingMatrix.Status -ceq 'migrated-heading') 'Installer did not migrate the legacy routing brand heading'
  Assert-True ([IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false)).Contains('## Codex Routing Matrix - Default Multi-Model Quality Team')) 'Installer did not install the current routing matrix heading'

  $stalePluginRule = [regex]::Replace([IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false)), '(?ms)(^## Codex Routing Matrix[^\r\n]*\r?\n).*\z', '$1`nstale plugin content')
  [IO.File]::WriteAllText($freshAgents, $stalePluginRule, [Text.UTF8Encoding]::new($false))
  $refreshedRuleInstall = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True ($refreshedRuleInstall.RoutingMatrix.Status -ceq 'refreshed') 'Installer did not refresh its own stale routing section'
  Assert-True ([IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false)).Contains('enable super mode')) 'Refreshed routing section did not contain the current Super mode command'

  $numberedPluginRule = [IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false)).Replace('## Codex Routing Matrix - Default Multi-Model Quality Team', '## Rule 8 - Default Multi-Model Quality Team')
  [IO.File]::WriteAllText($freshAgents, $numberedPluginRule, [Text.UTF8Encoding]::new($false))
  $migratedInstall = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True ($migratedInstall.RoutingMatrix.Status -ceq 'migrated-heading') 'Installer did not remove the legacy plugin rule number'
  Assert-True ([IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false)).Contains('## Codex Routing Matrix - Default Multi-Model Quality Team')) 'Installer did not restore the unnumbered plugin heading'

  $staleRule = "## Rule 5 - keep`n`nkeep me`n`n## User Project Rule`n`nuser content`n`n## Rule 7 - keep`n`nkeep me too`n"
  [IO.File]::WriteAllText($freshAgents, $staleRule, [Text.UTF8Encoding]::new($false))
  $syncedInstall = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True ($syncedInstall.RoutingMatrix.Status -ceq 'appended') 'Installer did not append the routing matrix'
  Assert-True (-not [string]::IsNullOrWhiteSpace($syncedInstall.RoutingMatrix.Backup)) 'Routing matrix insertion did not back up AGENTS.md'
  $syncedText = [IO.File]::ReadAllText($freshAgents, [Text.UTF8Encoding]::new($false))
  Assert-True ($syncedText.Contains('## Rule 5 - keep')) 'Routing matrix synchronization removed the preceding rule'
  Assert-True ($syncedText.Contains('## User Project Rule')) 'Installer replaced an unrelated user rule'
  Assert-True ($syncedText.Contains('## Rule 7 - keep')) 'Routing matrix synchronization removed the following rule'
  Assert-True ($syncedText.Contains('## Codex Routing Matrix - Default Multi-Model Quality Team')) 'Installer did not append the unnumbered plugin rule'
  Assert-True (-not $syncedText.Contains('## Meta Rule - Conflict Resolution')) 'Default rules were restored after first install'
  Assert-True (Test-Path -LiteralPath (Join-Path $syncedInstall.RoutingMatrix.Backup 'AGENTS.md') -PathType Leaf) 'Routing matrix backup file is missing'

  $freshLuna = Join-Path $freshHome 'agents/luna-worker.toml'
  $localEdit = [IO.File]::ReadAllText($freshLuna, [Text.UTF8Encoding]::new($false)) + "`n# local managed edit`n"
  [IO.File]::WriteAllText($freshLuna, $localEdit, [Text.UTF8Encoding]::new($false))
  $localEditHash = (Get-FileHash -LiteralPath $freshLuna -Algorithm SHA256).Hash
  $refreshedInstall = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  $refreshedProfile = @($refreshedInstall.Results | Where-Object { $_.Agent -ceq 'luna_worker' })
  $refreshEvidence = $refreshedInstall.Results | ConvertTo-Json -Compress
  Assert-True ($refreshedProfile.Count -eq 1) "Profile refresh returned an unexpected result set: $refreshEvidence"
  Assert-True ($refreshedProfile[0].Status -ceq 'refresh') "Plugin-owned profile content was not refreshed: $refreshEvidence"
  Assert-True ($refreshedProfile[0].Ownership -ceq 'created') "Profile refresh changed ownership: $refreshEvidence"
  Assert-True (-not [string]::IsNullOrWhiteSpace($refreshedProfile[0].Backup)) 'Profile refresh did not create a backup'
  $refreshBackupFile = Join-Path $refreshedProfile[0].Backup 'luna-worker.toml.bak'
  Assert-True ((Get-FileHash -LiteralPath $refreshBackupFile -Algorithm SHA256).Hash -ceq $localEditHash) 'Profile refresh backup did not preserve prior content'
  Assert-True ((Get-FileHash -LiteralPath $freshLuna -Algorithm SHA256).Hash -ceq (Get-FileHash -LiteralPath $lunaTemplate -Algorithm SHA256).Hash) 'Profile refresh did not install the current template'

  $freshReviewer = Join-Path $freshHome 'agents/sol-reviewer.toml'
  $freshState = Join-Path $freshHome '.codex-routing-matrix.install-state.json'
  $stateBeforeMigration = (Get-FileHash -LiteralPath $freshState -Algorithm SHA256).Hash
  foreach ($previousText in @($previousReviewer, $previousReviewer.Replace("`n", "`r`n"), $previousManagedReviewer, $previousManagedReviewer.Replace("`n", "`r`n"))) {
    [IO.File]::WriteAllText($freshReviewer, $previousText, [Text.UTF8Encoding]::new($false))
    $previousReviewerHash = (Get-FileHash -LiteralPath $freshReviewer -Algorithm SHA256).Hash
    $expectedHash = if ($previousText.Contains('inherit host permissions')) {
      if ($previousText.Contains("`r`n")) { '0230DF2B3D24A1F9F5462F12233DBF8B938EA2A9DB6D229A01E0D4E9C60D392E' } else { '4005B24664AF205FA3316CB3941A52F6029AFC2EF15D17833B3E188CF1E82842' }
    } else {
      if ($previousText.Contains("`r`n")) { '748199DF9DFBF7A3A0E62F8340FDF9B29EB4A014DDC9983D183BD482EE4D64D3' } else { '7BA63032444A01E4748C09FAE3960154E9B7C26E67BB558691F36E2F176AA085' }
    }
    Assert-True ($previousReviewerHash -ceq $expectedHash) 'Previous reviewer fixture no longer matches the shipped template'
    $reviewerMigration = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
    $migratedReviewer = @($reviewerMigration.Results | Where-Object { $_.Agent -ceq 'sol_reviewer' })
    Assert-True ($migratedReviewer.Count -eq 1 -and $migratedReviewer[0].Status -ceq 'refresh' -and $migratedReviewer[0].Ownership -ceq 'created') 'Known owned reviewer did not refresh while retaining ownership'
    Assert-True ((Get-FileHash -LiteralPath (Join-Path $migratedReviewer[0].Backup 'sol-reviewer.toml.bak') -Algorithm SHA256).Hash -ceq $previousReviewerHash) 'Reviewer migration did not preserve the old template backup'
    Assert-True ((Get-FileHash -LiteralPath $freshReviewer -Algorithm SHA256).Hash -ceq (Get-FileHash -LiteralPath $reviewerTemplate -Algorithm SHA256).Hash) 'Reviewer migration did not install the current template'
    Assert-True ((Get-FileHash -LiteralPath $freshState -Algorithm SHA256).Hash -ceq $stateBeforeMigration) 'Reviewer migration changed ownership state'
    $reviewerRepeat = ((& $installScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
    Assert-True (@($reviewerRepeat.Results | Where-Object { $_.Agent -ceq 'sol_reviewer' -and $_.Status -ceq 'kept' -and $null -eq $_.Backup }).Count -eq 1) 'Reviewer migration was not idempotent'
  }

  foreach ($previousText in @($previousTerraLatest, $previousTerraLatest.Replace("`n", "`r`n"), $previousTerraHistorical, $previousTerraHistorical.Replace("`n", "`r`n"))) {
    $terraHome = Join-Path $tempRoot ('terra-migration-' + [guid]::NewGuid().ToString('N') + '/.codex')
    $terraInstall = ((& $installScript -CodexHome $terraHome) -join [Environment]::NewLine) | ConvertFrom-Json
    $terraPath = Join-Path $terraHome 'agents/terra-worker.toml'
    [IO.File]::WriteAllText($terraPath, $previousText, [Text.UTF8Encoding]::new($false))
    $previousTerraHash = (Get-FileHash -LiteralPath $terraPath -Algorithm SHA256).Hash
    $expectedTerraHash = if ($previousText.Contains('deeper reasoning')) {
      if ($previousText.Contains("`r`n")) { 'FC55BEAED703A6656F658D1718503C7C419E84131D31B6A9AD7B560A6D0D47F4' } else { '57ABDF330F7ACCA36948B25799CADC0A8E23C330F0F38F78E7DAE7224F74F073' }
    } else {
      if ($previousText.Contains("`r`n")) { 'B4222891BC1D4803F5D376BD3D5D5F4E45B5CFD35D35520026F806E3FF34CFE3' } else { '5F158C2E3F8A65C34165EE1F4D3AC7A580F0A5EAF78392FA6C034329521E6488' }
    }
    Assert-True ($previousTerraHash -ceq $expectedTerraHash) 'Previous Terra fixture no longer matches the shipped template history'
    $terraMigration = ((& $installScript -CodexHome $terraHome) -join [Environment]::NewLine) | ConvertFrom-Json
    $migratedTerra = @($terraMigration.Results | Where-Object { $_.Agent -ceq 'terra_worker' })
    Assert-True ($migratedTerra.Count -eq 1 -and $migratedTerra[0].Status -ceq 'refresh') 'Known Terra profile did not refresh'
    Assert-True ((Get-FileHash -LiteralPath (Join-Path $migratedTerra[0].Backup 'terra-worker.toml.bak') -Algorithm SHA256).Hash -ceq $previousTerraHash) 'Terra migration did not preserve the old profile backup'
    Assert-True ((Get-FileHash -LiteralPath $terraPath -Algorithm SHA256).Hash -ceq (Get-FileHash -LiteralPath $terraTemplate -Algorithm SHA256).Hash) 'Terra migration did not install the current template'
  }

  $freshRemoved = ((& $uninstallScript -CodexHome $freshHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($freshRemoved.Results | Where-Object { $_.Status -eq 'removed' }).Count -eq $profileCount) 'Fresh uninstall did not remove every owned profile'
  Assert-True (@(Get-ChildItem -LiteralPath (Join-Path $freshHome 'agents') -Filter '*.toml' -File).Count -eq 0) 'Fresh uninstall left owned profiles'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $freshHome '.codex-routing-matrix.install-state.json'))) 'Fresh uninstall left ownership state'

  $externalHome = Join-Path $tempRoot 'external/.codex'
  $externalAgents = Join-Path $externalHome 'agents'
  New-Item -ItemType Directory -Path $externalAgents -Force | Out-Null
  foreach ($template in Get-ChildItem -LiteralPath $templateDir -Filter '*.toml' -File) {
    Copy-Item -LiteralPath $template.FullName -Destination (Join-Path $externalAgents $template.Name)
  }
  $externalLuna = Join-Path $externalAgents 'luna-worker.toml'
  $externalEdit = [IO.File]::ReadAllText($externalLuna, [Text.UTF8Encoding]::new($false)) + "`n# external custom edit`n"
  [IO.File]::WriteAllText($externalLuna, $externalEdit, [Text.UTF8Encoding]::new($false))
  $externalHashes = @{}
  foreach ($profile in Get-ChildItem -LiteralPath $externalAgents -Filter '*.toml' -File) {
    $externalHashes[$profile.Name] = (Get-FileHash -LiteralPath $profile.FullName -Algorithm SHA256).Hash
  }
  $externalInstall = ((& $installScript -CodexHome $externalHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($externalInstall.Results | Where-Object { $_.Status -eq 'kept' -and $_.Ownership -eq 'external' }).Count -eq $profileCount) 'Compatible external profiles were incorrectly claimed'
  Assert-True ((Get-FileHash -LiteralPath $externalLuna -Algorithm SHA256).Hash -ceq $externalHashes['luna-worker.toml']) 'Compatible external profile was overwritten'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $externalHome '.codex-routing-matrix.install-state.json'))) 'Compatible external profiles created ownership state'
  $externalUninstall = ((& $uninstallScript -CodexHome $externalHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($externalUninstall.Results | Where-Object { $_.Status -eq 'preserved-not-owned' }).Count -eq $profileCount) 'Uninstall did not preserve external profiles'
  Assert-True (@(Get-ChildItem -LiteralPath $externalAgents -Filter '*.toml' -File).Count -eq $profileCount) 'Uninstall removed an external profile'

  $adoptedInstall = ((& $installScript -CodexHome $externalHome -Force) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($adoptedInstall.Results | Where-Object { $_.Status -eq 'replace' -and $_.Ownership -eq 'replaced' }).Count -eq $profileCount) 'Force install did not adopt every compatible external profile'
  $adoptedUninstall = ((& $uninstallScript -CodexHome $externalHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($adoptedUninstall.Results | Where-Object { $_.Status -eq 'restored-original' }).Count -eq $profileCount) 'Force uninstall did not restore adopted profiles'
  foreach ($profile in Get-ChildItem -LiteralPath $externalAgents -Filter '*.toml' -File) {
    Assert-True ((Get-FileHash -LiteralPath $profile.FullName -Algorithm SHA256).Hash -ceq $externalHashes[$profile.Name]) "Force uninstall restored the wrong external profile: $($profile.Name)"
  }

  $reviewerCases = @(
    $previousReviewer.Replace('model = "gpt-6.1-sol"', 'model = "gpt-6-astra"'),
    ($previousManagedReviewer.Replace('model = "gpt-6.1-sol"', 'model = "gpt-6-astra"').Replace('Review the declared outcome', 'Follow my custom review conventions. Review the declared outcome') + 'sandbox_mode = "workspace-write"' + [Environment]::NewLine)
  )
  for ($case = 0; $case -lt $reviewerCases.Count; $case++) {
    $reviewerHome = Join-Path $tempRoot "external-reviewer-$case/.codex"
    $reviewerAgents = Join-Path $reviewerHome 'agents'
    New-Item -ItemType Directory -Path $reviewerAgents -Force | Out-Null
    $externalReviewer = Join-Path $reviewerAgents 'sol-reviewer.toml'
    [IO.File]::WriteAllText($externalReviewer, $reviewerCases[$case], [Text.UTF8Encoding]::new($false))
    $externalReviewerHash = (Get-FileHash -LiteralPath $externalReviewer -Algorithm SHA256).Hash
    $reviewerInstall = ((& $installScript -CodexHome $reviewerHome) -join [Environment]::NewLine) | ConvertFrom-Json
    Assert-True (@($reviewerInstall.Results | Where-Object { $_.Agent -ceq 'sol_reviewer' -and $_.Status -ceq 'kept' -and $_.Ownership -ceq 'external' }).Count -eq 1) "Compatible external reviewer case $case was not preserved as external"
    Assert-True ((Get-FileHash -LiteralPath $externalReviewer -Algorithm SHA256).Hash -ceq $externalReviewerHash) "Install changed external reviewer case $case"
    Assert-True ($reviewerInstall.ReviewerWriteIsolation -ceq 'NOT_VERIFIED') "Install claimed isolation for external reviewer case $case"
    $reviewerState = Get-Content -LiteralPath (Join-Path $reviewerHome '.codex-routing-matrix.install-state.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert-True ($reviewerState.profiles.PSObject.Properties.Name -notcontains 'sol-reviewer.toml') "Install claimed ownership of external reviewer case $case"
  }

  $conflictingReviewers = @($previousReviewer, ($previousManagedReviewer + "# external custom edit`n"))
  for ($case = 0; $case -lt $conflictingReviewers.Count; $case++) {
    $reviewerHome = Join-Path $tempRoot "conflicting-reviewer-$case/.codex"
    $reviewerAgents = Join-Path $reviewerHome 'agents'
    New-Item -ItemType Directory -Path $reviewerAgents -Force | Out-Null
    $externalReviewer = Join-Path $reviewerAgents 'sol-reviewer.toml'
    [IO.File]::WriteAllText($externalReviewer, $conflictingReviewers[$case], [Text.UTF8Encoding]::new($false))
    $externalReviewerHash = (Get-FileHash -LiteralPath $externalReviewer -Algorithm SHA256).Hash
    $reviewerError = $null
    try { & $installScript -CodexHome $reviewerHome | Out-Null } catch { $reviewerError = $_.Exception.Message }
    Assert-True ($reviewerError -match 'sol_reviewer|sol-reviewer') "External Sol reviewer case $case did not report its conflict"
    Assert-True ((Get-FileHash -LiteralPath $externalReviewer -Algorithm SHA256).Hash -ceq $externalReviewerHash) "Install overwrote conflicting external Sol reviewer case $case"
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $reviewerHome '.codex-routing-matrix.install-state.json'))) "Reviewer conflict case $case changed ownership state"
    Assert-True (@(Get-ChildItem -LiteralPath $reviewerAgents -Filter '*.toml' -File).Count -eq 1) "Reviewer conflict case $case partially installed profiles"
  }

  $forceHome = Join-Path $tempRoot 'force/.codex'
  $forceAgents = Join-Path $forceHome 'agents'
  $forceLuna = Join-Path $forceAgents 'luna-worker.toml'
  New-Item -ItemType Directory -Path $forceAgents -Force | Out-Null
  Set-ConflictingLunaProfile $lunaTemplate $forceLuna
  $originalHash = (Get-FileHash -LiteralPath $forceLuna -Algorithm SHA256).Hash
  $rejected = $false
  try {
    & $installScript -CodexHome $forceHome | Out-Null
  } catch {
    $rejected = $true
  }
  Assert-True $rejected 'Conflicting profile was not rejected'
  Assert-True ((Get-FileHash -LiteralPath $forceLuna -Algorithm SHA256).Hash -ceq $originalHash) 'Rejected install modified the conflicting profile'
  Assert-True (@(Get-ChildItem -LiteralPath $forceAgents -Filter '*.toml' -File).Count -eq 1) 'Rejected install created another profile'

  $forced = ((& $installScript -CodexHome $forceHome -Force) -join [Environment]::NewLine) | ConvertFrom-Json
  $replaced = @($forced.Results | Where-Object { $_.Agent -eq 'luna_worker' -and $_.Status -eq 'replace' -and $_.Ownership -eq 'replaced' })
  Assert-True ($replaced.Count -eq 1) 'Force install did not record replacement ownership'
  Assert-True (-not [string]::IsNullOrWhiteSpace($replaced[0].Backup)) 'Force install did not create a backup'
  $forceUninstall = ((& $uninstallScript -CodexHome $forceHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($forceUninstall.Results | Where-Object { $_.Status -eq 'removed' }).Count -eq ($profileCount - 1)) 'Force uninstall did not remove created profiles'
  Assert-True (@($forceUninstall.Results | Where-Object { $_.Status -eq 'restored-original' }).Count -eq 1) 'Force uninstall did not restore the replaced profile'
  Assert-True ((Get-FileHash -LiteralPath $forceLuna -Algorithm SHA256).Hash -ceq $originalHash) 'Force uninstall restored the wrong profile content'
  Assert-True (@(Get-ChildItem -LiteralPath $forceAgents -Filter '*.toml' -File).Count -eq 1) 'Force uninstall left unexpected profiles'

  $modifiedHome = Join-Path $tempRoot 'modified/.codex'
  & $installScript -CodexHome $modifiedHome | Out-Null
  $modifiedLuna = Join-Path $modifiedHome 'agents/luna-worker.toml'
  $modifiedText = [IO.File]::ReadAllText($modifiedLuna, [Text.UTF8Encoding]::new($false)) + "`n# user modified but contract compatible`n"
  [IO.File]::WriteAllText($modifiedLuna, $modifiedText, [Text.UTF8Encoding]::new($false))
  $modifiedHash = (Get-FileHash -LiteralPath $modifiedLuna -Algorithm SHA256).Hash
  $modifiedUninstall = ((& $uninstallScript -CodexHome $modifiedHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($modifiedUninstall.Results | Where-Object { $_.Status -eq 'preserved-modified' }).Count -eq 1) 'Uninstall did not preserve a modified owned profile'
  Assert-True ((Get-FileHash -LiteralPath $modifiedLuna -Algorithm SHA256).Hash -ceq $modifiedHash) 'Uninstall changed a modified owned profile'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $modifiedHome '.codex-routing-matrix.install-state.json'))) 'Modified ownership state was not discarded'
  $modifiedReinstall = ((& $installScript -CodexHome $modifiedHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($modifiedReinstall.Results | Where-Object { $_.Agent -eq 'luna_worker' -and $_.Status -eq 'kept' -and $_.Ownership -eq 'external' }).Count -eq 1) 'Reinstall did not treat the preserved custom profile as external'
  Assert-True ((Get-FileHash -LiteralPath $modifiedLuna -Algorithm SHA256).Hash -ceq $modifiedHash) 'Reinstall overwrote a preserved custom profile'

  $legacyHome = Join-Path $tempRoot 'legacy/.codex'
  $legacyAgents = Join-Path $legacyHome 'agents'
  $legacyBackupDir = Join-Path $legacyAgents 'sol-reviewer.toml-20260801-000000000'
  New-Item -ItemType Directory -Path $legacyBackupDir -Force | Out-Null
  Copy-Item -LiteralPath $reviewerTemplate -Destination (Join-Path $legacyAgents 'sol-reviewer.toml')
  $originalReviewer = "name = `"sol_reviewer`"`nmodel = `"gpt-5.6-sol`"`n# original external profile`n"
  [IO.File]::WriteAllText((Join-Path $legacyBackupDir 'sol-reviewer.toml'), $originalReviewer, [Text.UTF8Encoding]::new($false))
  $legacyState = [ordered]@{
    schemaVersion = 1
    profiles = [ordered]@{
      'sol-reviewer.toml' = [ordered]@{
        ownership = 'replaced'
        backupFile = 'agents\sol-reviewer.toml-20260801-000000000\sol-reviewer.toml'
      }
    }
  } | ConvertTo-Json -Depth 5
  [IO.File]::WriteAllText((Join-Path $legacyHome '.codex-quality-orchestrator.install-state.json'), $legacyState + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
  $legacyInstall = ((& $installScript -CodexHome $legacyHome) -join [Environment]::NewLine) | ConvertFrom-Json
  Assert-True (@($legacyInstall.Results | Where-Object { $_.Agent -eq 'sol_reviewer' -and $_.Status -eq 'kept' -and $_.Ownership -eq 'replaced' }).Count -eq 1) 'Upgrade did not reactivate the managed reviewer'
  Assert-True ((Get-FileHash -LiteralPath (Join-Path $legacyAgents 'sol-reviewer.toml') -Algorithm SHA256).Hash -ceq (Get-FileHash -LiteralPath $reviewerTemplate -Algorithm SHA256).Hash) 'Upgrade changed the active reviewer'
  Assert-True (Test-Path -LiteralPath (Join-Path $legacyBackupDir 'sol-reviewer.toml.bak') -PathType Leaf) 'Legacy loadable backup was not converted to .bak'
  Assert-True (-not (Test-Path -LiteralPath (Join-Path $legacyBackupDir 'sol-reviewer.toml') -PathType Leaf)) 'Legacy loadable backup still shadows an agent profile'
  $legacyStateAfter = Get-Content -LiteralPath (Join-Path $legacyHome '.codex-routing-matrix.install-state.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  Assert-True (Test-Path -LiteralPath (Join-Path $legacyHome '.codex-quality-orchestrator.install-state.json') -PathType Leaf) 'Migration removed the legacy state before the new install was verified'
  Assert-True ($legacyStateAfter.profiles.PSObject.Properties.Name -contains 'sol-reviewer.toml') 'Reactivated reviewer lost ownership state'
  Assert-True ([string]$legacyStateAfter.profiles.'sol-reviewer.toml'.backupFile -like '*.toml.bak') 'Reactivated reviewer did not retain a non-loadable restore backup'

  $lockedHome = Join-Path $tempRoot 'locked/.codex'
  New-Item -ItemType Directory -Path $lockedHome -Force | Out-Null
  $lockedState = Join-Path $lockedHome '.codex-routing-matrix.install-state.json'
  $lockedInstall = Join-Path $lockedHome '.codex-routing-matrix.install.lock'
  [IO.File]::WriteAllText($lockedState, '{invalid state', [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText($lockedInstall, 'held', [Text.UTF8Encoding]::new($false))
  $lockErrorType = $null
  try {
    & $installScript -CodexHome $lockedHome | Out-Null
  } catch {
    $lockError = $_.Exception
    if ($null -ne $lockError.InnerException) { $lockError = $lockError.InnerException }
    $lockErrorType = $lockError.GetType().FullName
  }
  Assert-True ($lockErrorType -ceq 'System.IO.IOException') 'Installer read state or targets before acquiring the install lock'

  Write-Output 'PASS ownership-aware install, reviewer contract migration and external preservation, non-loadable backups, lock ordering, and guarded uninstall'
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    $resolved = [IO.Path]::GetFullPath($tempRoot)
    $tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if (-not $resolved.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to remove non-temporary path: $resolved"
    }
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}

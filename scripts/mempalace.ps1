param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$env:PYTHONUTF8 = "1"
python -m mempalace @Args

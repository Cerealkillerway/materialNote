@echo off

tools\nuget setApiKey <API_KEY> -ConfigFile tools\NuGet.Config
tools\nuget pack materialnote.nuspec -version <VERSION> -OutputDirectory build

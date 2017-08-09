## Publish new version

### 1. `develop` to `master`

Send pull request `develop` to `master` on github repository and merge it.
https://github.com/materialnote/materialnote/compare/master...develop

### 2. Build dist files

Build dist files and push to master
```bash
# change branch
git checkout master
# fetch all changes
git pull
# build dist files and binary(.zip) for release post
grunt dist
# Push new dist files to remote repository.
git commit -a -m "Update dist files"
git push origin
```

### 3. Release new version
Post release note with new tag version on github

https://github.com/materialnote/materialnote/releases/new

### 4. Publish

Publish on npm
```bash
npm publish
```

Publish on meteor
```bash
meteor/publish.sh
```

### 05. Update materialnote.github.io
Update materialnote version in _config.yml.

### 06. Update connector
 - [materialnote-rails](https://github.com/materialnote/materialnote-rails/blob/master/MAINTAIN.md)

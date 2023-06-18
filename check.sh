if [ -d "content" ] 
then
    echo "Directory content exists." 
else
    echo "Error: Directory content does not exists."
    exit 1
fi

rm -rf content
mv ~/notes-export content
find content -type f -name "* *"
git add .
git status


if [ -d "content" ] 
then
    echo "Directory content exists." 
else
    echo "Error: Directory content does not exists."
    exit 1
fi

rm -rf content
mv ~/notes-export content
git add .
git status


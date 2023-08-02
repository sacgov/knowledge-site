if [ -d "content" ] 
then
    echo "Copying Content to Notion" 
else
    echo "Error: Directory content does not exists."
    exit 1
fi

# Cleaning and creating an empty Workspace
rm -rf notion-content-copy
rm -rf notion-content-import

mkdir notion-content-copy
mkdir notion-content-import

cp -r content/ notion-content-copy

shopt -s nullglob 


find notion-content-copy -type f -name "*.md" -not -name '_index.md'| while read line
do
    # echo $line | cut -d'/' -f2- | sed 's/\//_/'
    cp "$line" notion-content-import/`echo $line | cut -d'/' -f2- | sed 's/\//_/'`
done

rm -rf notion-content-copy

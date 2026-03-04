for file in test_cases/*; do
    echo "$file"
    python main.py "$file"
done
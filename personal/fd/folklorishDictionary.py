# Folklorish Dictionary.
# Author: Slush
# Date: 1/16/25

def create_dictionary(dictionary_file):
    with open(dictionary_file, "r", encoding="utf-8") as file:
        unsorted_data = {}
        index = 1
        for line in file:
            key, value = line.strip().split(" - ")
            unsorted_data[key.strip()] = value.strip()
        sorted_data = dict(sorted(unsorted_data.items()))
        for key, value in sorted_data.items():
            print(f"{index}. {key}: {value}")
            index += 1
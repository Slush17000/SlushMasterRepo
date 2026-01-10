import json
import time

# Real coordinates for Virginia trails
coordinates_map = {
    "Nellysford": {"lat": 37.9043, "lng": -78.8639},
    "Natural Bridge Station": {"lat": 37.6279, "lng": -79.5431},
    "Glasgow": {"lat": 37.6368, "lng": -79.4486},
    "Buena Vista": {"lat": 37.7346, "lng": -79.3545},
    "Rockbridge Baths": {"lat": 37.9017, "lng": -79.4178},
    "Big Island": {"lat": 37.5279, "lng": -79.3589},
    "Natural Bridge": {"lat": 37.6299, "lng": -79.5431},
    "Lexington": {"lat": 37.7840, "lng": -79.4428},
    "Vesuvius": {"lat": 37.8996, "lng": -79.1764},
    "Montebello": {"lat": 37.8457, "lng": -79.1339},
    "Lyndhurst": {"lat": 38.0276, "lng": -78.9447},
    "Afton": {"lat": 38.0443, "lng": -78.8342},
    "Stuarts Draft": {"lat": 38.0276, "lng": -79.0342},
    "Fishersville": {"lat": 38.0965, "lng": -78.9711},
    "Verona": {"lat": 38.1979, "lng": -79.0042},
    "Staunton": {"lat": 38.1496, "lng": -79.0717},
    "Greenville": {"lat": 37.9554, "lng": -79.1578},
    "Wintergreen": {"lat": 37.9293, "lng": -78.9264},
    "Tyro": {"lat": 37.8043, "lng": -79.0342},
    "Massies Mill": {"lat": 37.8415, "lng": -78.9847},
    "Faber": {"lat": 37.8651, "lng": -78.7547},
    "Lovingston": {"lat": 37.7615, "lng": -78.8706},
    "Roseland": {"lat": 37.8001, "lng": -79.0906},
    "Amherst": {"lat": 37.5849, "lng": -79.0514},
    "Madison Heights": {"lat": 37.4357, "lng": -79.1100},
    "Lynchburg": {"lat": 37.4138, "lng": -79.1422},
    "Bedford": {"lat": 37.3343, "lng": -79.5231},
    "Forest": {"lat": 37.3671, "lng": -79.2914},
    "Thaxton": {"lat": 37.3754, "lng": -79.6653},
    "Buchanan": {"lat": 37.5282, "lng": -79.6789},
    "Fincastle": {"lat": 37.4993, "lng": -79.8756},
    "Troutville": {"lat": 37.4129, "lng": -79.8728},
    "Cloverdale": {"lat": 37.3693, "lng": -79.9056},
    "Daleville": {"lat": 37.4118, "lng": -79.9161},
    "Roanoke": {"lat": 37.2710, "lng": -79.9414},
    "Salem": {"lat": 37.2935, "lng": -80.0548},
    "Newport": {"lat": 37.2982, "lng": -80.5073},
    "Pembroke": {"lat": 37.3218, "lng": -80.6373},
    "Pearisburg": {"lat": 37.3254, "lng": -80.7345},
    "Narrows": {"lat": 37.3318, "lng": -80.8095},
    "Rich Creek": {"lat": 37.3843, "lng": -80.8156},
    "Blacksburg": {"lat": 37.2296, "lng": -80.4139},
    "Christiansburg": {"lat": 37.1299, "lng": -80.4090},
    "Radford": {"lat": 37.1318, "lng": -80.5764},
    "Floyd": {"lat": 36.9115, "lng": -80.3198},
    "Check": {"lat": 36.8818, "lng": -80.7448},
    "Meadows of Dan": {"lat": 36.7418, "lng": -80.4106},
    "Stuart": {"lat": 36.6393, "lng": -80.2670},
    "Ararat": {"lat": 36.6057, "lng": -80.5373},
    "Mount Airy": {"lat": 36.4993, "lng": -80.6073},
    "Galax": {"lat": 36.6612, "lng": -80.9239},
    "Fancy Gap": {"lat": 36.6543, "lng": -80.7023},
    "Hillsville": {"lat": 36.7626, "lng": -80.7351},
    "Wytheville": {"lat": 36.9485, "lng": -81.0848},
    "Rural Retreat": {"lat": 36.8940, "lng": -81.2784},
    "Marion": {"lat": 36.8348, "lng": -81.5151},
    "Chilhowie": {"lat": 36.7976, "lng": -81.6829},
    "Damascus": {"lat": 36.6318, "lng": -81.7843},
    "Abingdon": {"lat": 36.7098, "lng": -81.9774},
    "Bristol": {"lat": 36.5951, "lng": -82.1887},
    "Crozet": {"lat": 38.0707, "lng": -78.7003},
    "Troutdale": {"lat": 36.7001, "lng": -81.4373},
    "Fairfax Station": {"lat": 38.7971, "lng": -77.3272},
    "Mouth of Wilson": {"lat": 36.5851, "lng": -81.3051},
    "Alexandria": {"lat": 38.8048, "lng": -77.0469},
    "Elkton": {"lat": 38.4079, "lng": -78.6236},
    "Bland": {"lat": 37.1007, "lng": -81.1143},
    "Dungannon": {"lat": 36.8234, "lng": -82.4651},
    "Stokesville": {"lat": 38.3276, "lng": -79.2392},
    "Dickerson": {"lat": 39.2176, "lng": -77.4278},
    "Potomac": {"lat": 39.0179, "lng": -77.2086},
    "Laneville": {"lat": 39.0526, "lng": -79.4631},
    "Circleville": {"lat": 38.6743, "lng": -79.4989},
    "Gauley Bridge": {"lat": 38.1676, "lng": -81.1987},
    "Lansing": {"lat": 38.0737, "lng": -81.0556},
    "Fayetteville": {"lat": 38.0529, "lng": -81.1037},
    "Burnsville": {"lat": 35.9165, "lng": -82.2968},
    "Linville Falls": {"lat": 35.9568, "lng": -81.9326},
    "Brevard": {"lat": 35.2334, "lng": -82.7343},
    "Pisgah Forest": {"lat": 35.2762, "lng": -82.6612},
}

# Load the trails data
with open('src/api/trails.json', 'r') as f:
    data = json.load(f)

# Update trails with placeholder coordinates
for trail in data['trails']:
    coords = trail.get('coordinates', {})
    # Check if coordinates are placeholders (whole numbers)
    if coords.get('lat') == int(coords.get('lat', 0)) and coords.get('lng') == int(coords.get('lng', 0)):
        city = trail['location']['city']
        if city in coordinates_map:
            trail['coordinates'] = coordinates_map[city]
            print(f"Updated {trail['name']} ({city}): {coordinates_map[city]}")
        else:
            print(f"WARNING: No coordinates found for {trail['name']} in {city}")

# Save the updated data
with open('src/api/trails.json', 'w') as f:
    json.dump(data, f, indent=2)

print("\nCoordinates updated successfully!")

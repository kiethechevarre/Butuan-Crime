from django.http import JsonResponse

from .models import *

def barangays(request):
    """
    API that returns the list of barangays
    """

    # Get all existing barangays in the database
    barangays = Barangay.objects.all().values("id", "name").order_by("name")

    data = {}

    # For every barangay in the list
    # add it inside the data dictionary
    data["barangays"] = [barangay for barangay in barangays]

    # Return a JSON response
    return JsonResponse(data, safe=False, status=200)

def crimes(request):
    """
    API that returns the list of possible crimes
    """

    # Get all the possible crimes in the database
    crimes = Crime.objects.all().values("id", "name")

    data = {}

    possible_crimes = []

    # Remove duplicated crime names
    for crime in crimes:
        if crime["name"] not in possible_crimes:
            possible_crimes.append(crime["name"])

    # For every possible crime in the list
    # add it inside the data dictionary
    data["crimes"] = [crime for crime in possible_crimes]

    # Return a JSON response
    return JsonResponse(data, safe=False, status=200)

def barangay(request, barangay_name):
    """
    API that returns the possible crimes and its count 
    that happened in the chosen Butuan barangay
    """

    # Get and verify if the barangay exists
    try:
        chosen_barangay = Barangay.objects.get(name=barangay_name)
    except Barangay.DoesNotExist:
        return JsonResponse({"error": "Invalid barangay name"}, status=404)        

    # Get the data of the crimes for that barangay
    crimes = Crime.objects.filter(barangay=chosen_barangay)

    data = {}

    # Get the total count of the crime occurrences in that barangay
    data["total"] = crimes.count()

    # Iterate over all the possible crimes inside that barangay
    # and increment its count inside the dictionary
    for crime in crimes.values("name"):
        if crime["name"] not in data:
            data[crime["name"]] = 1
        else:
            data[crime["name"]] += 1

    # Return a JSON response
    return JsonResponse(data, safe=False, status=200)

def crime(request, crime_name):
    """
    API that returns what barangay the chosen crime has
    occurred and its count inside that barangay
    """

    # Verify if the crime exists
    occurrences = Crime.objects.filter(name__icontains=crime_name)

    if not occurrences:
        return JsonResponse({"error": "Invalid crime name"}, status=404)

    # Get the list of the barangays from where that crime happened
    data = {}

    # The total of crime occurrences
    data["yearly_totals"] = {}

    # The crime type of the data
    data["crime"] = crime_name

    # The datetime of crime occurrences
    data["datetime"] = []

    # Iterate over all the occurrences
    for occurrence in occurrences.values("barangay", "datetime"):
        # Get the barangay and its name
        barangay = Barangay.objects.filter(pk=occurrence["barangay"]).values("name")
        barangay = barangay[0]["name"]

        # Check if barangay is already inside the data
        # If it is, increment the count
        # If not, set the count to 1
        if barangay not in data:
            data[barangay] = 1
        else:
            data[barangay] += 1
        
        data["datetime"].append(occurrence["datetime"])

        # Get datetime of current crime occurrence
        current_year = occurrence["datetime"].year
        current_year = current_year

        # Append yearly totals
        if current_year not in data["yearly_totals"]:
            data["yearly_totals"][current_year] = 1
        else:
            data["yearly_totals"][current_year] += 1

    # return a JSON response
    return JsonResponse(data, safe=False)

def barangay_crime(request, barangay_name, crime_name):
    """
    API that returns the barangay's chosen crime's
    occurrences with its date and time 
    """

    # Get and verify if the barangay exists
    try:
        chosen_barangay = Barangay.objects.get(name=barangay_name)
    except Barangay.DoesNotExist:
        return JsonResponse({"error": "Invalid barangay name"}, status=404)

    # Get and verify if the crime exists
    occurrences = Crime.objects.filter(name__icontains=crime_name, barangay=chosen_barangay)
    if not occurrences:
        return JsonResponse({"error": "Invalid crime name or Crime does not exist"}, status=404)
    
    # Declare a data dictionary value
    data = {}

    # Declare a yearly_totals dictionary
    data["yearly_totals"] = {}

    # Declare a datetime array in the dictionary
    data["datetime"] = []

    # Put the total amount of crime per year has occurred inside the barangay inside the dictionary
    for occurrence in occurrences:
        # Append current datetime of occurrence to occurrences dictionary
        data["datetime"].append(occurrence.datetime)

        # Get current year of occurrence
        current_year = occurrence.datetime.year
        # Append yearly totals
        if current_year not in data["yearly_totals"]:
            data["yearly_totals"][current_year] = 1
        else:
            data["yearly_totals"][current_year] += 1

    # Return a JSON response
    return JsonResponse(data, safe=False)

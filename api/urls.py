from django.urls import path
from . import views

urlpatterns = [
    # Return a JSON of barangays in butuan
    path("barangays", views.barangays, name="barangays"),
    # Return a JSON of focus crimes
    path("crimes", views.crimes, name="crimes"),
    # Return a JSON of crimes in a specific barangay
    path("barangay/<str:barangay_name>", views.barangay, name="barangay"),
    # Return a JSON of 
    path("crime/<str:crime_name>", views.crime, name="crime"),
    path("barangay_crime/<str:barangay_name>/<str:crime_name>", views.barangay_crime, name="barangay_crime")
]

"""
Routes and their JSON information;

/barangays

{
    "barangays": [
        {
            "id": 1,
            "name": "ambago"
        },
        ...
    ]
}


/crimes

{
    "crimes": [
        "murder",
        "homicide",
        ...
    ]
}


/barangay/<str:barangay_name>

{
    "murder": 4,
    "rape": 2,
    ...
}


/crime/<str:crime_name>

{
    "ambago": 3,
    "amparo": 1,
    ...
}


/barangay_crime/<str:barangay_name>/<str:crime_name>

{
    "datetime": [
        "2021-03-06T11:45:00Z",
        ...
    ]
    "total": 5
}
"""

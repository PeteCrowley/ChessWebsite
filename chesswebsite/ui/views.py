from django.shortcuts import render
import sys, os

# Create your views here.
def index(request, *args, **kwargs):
    # print("CWD:", os.getcwd(), file=sys.stderr)
    return render(request, 'index.html')

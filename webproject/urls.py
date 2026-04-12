from django.urls import path
from django.views.generic import TemplateView
from pfc import views  # замени на своё приложение

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html')),
    path('register/', views.register_view),
    path('login/', views.login_view),
    path('new_ration/', views.new_ration),
    path('weight_history/', views.weight_history),
]
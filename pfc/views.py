import json
from datetime import date

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from .models import Person


def parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return {}


@csrf_exempt
@require_POST
def register_view(request):
    data = parse_json(request)
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if len(username) < 3:
        return JsonResponse({"ok": False, "message": "Логин должен быть не короче 3 символов"}, status=400)

    if len(password) < 4:
        return JsonResponse({"ok": False, "message": "Пароль должен быть не короче 4 символов"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"ok": False, "message": "Такой логин уже существует"}, status=400)

    user = User.objects.create_user(username=username, password=password)
    login(request, user)

    return JsonResponse({"ok": True, "message": f"Пользователь {username} создан и выполнен вход"})


@csrf_exempt
@require_POST
def login_view(request):
    data = parse_json(request)
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"ok": False, "message": "Неверный логин или пароль"}, status=400)

    login(request, user)
    return JsonResponse({"ok": True, "message": f"Вход выполнен: {user.username}"})


@csrf_exempt
@login_required
def new_ration(request):
    if request.method != "POST":
        return JsonResponse({"ok": False, "message": "Only POST allowed"}, status=405)

    data = parse_json(request)
    today = date.today()

    try:
        person, created = Person.objects.update_or_create(
            user=request.user,
            currentdate=today,
            defaults={
                "weight": float(data.get("weight")),
                "age": int(data.get("age")),
                "activity": float(data.get("activity")),
                "length": float(data.get("height")),
                "gender": data.get("sex", ""),
                "ziel": str(data.get("goal", "")),
            }
        )
    except (TypeError, ValueError):
        return JsonResponse({"ok": False, "message": "Некорректные данные"}, status=400)

    return JsonResponse({
        "ok": True,
        "created": created,
        "message": "Запись обновлена" if not created else "Запись добавлена"
    })


@csrf_exempt
@require_GET
def weight_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "message": "Требуется вход", "items": []}, status=401)

    entries = (
        Person.objects.filter(user=request.user)
        .order_by("-currentdate", "-id")
        .values("currentdate", "weight", "length")
    )

    items = [
        {
            "date": entry["currentdate"].isoformat(),
            "weight": entry["weight"],
            "height": entry["length"],
        }
        for entry in entries
    ]

    return JsonResponse({"ok": True, "items": items})
# ── Stage 1: BUILD ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore зависимостей отдельным слоем (кеш Docker)
COPY Lab12TVCompanyX.csproj .
RUN dotnet restore

# Копируем остальной исходный код и публикуем
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 2: RUNTIME ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Копируем только артефакты сборки (без SDK)
COPY --from=build /app/publish .

# Слушаем на 8080 (стандартный порт ASP.NET Core в контейнере)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Lab12TVCompanyX.dll"]

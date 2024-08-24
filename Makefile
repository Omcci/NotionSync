run-dev:
	docker-compose up --build

logs-dev:
	docker-compose logs -f

run-prod:
	docker-compose -f docker-compose.prod.yml up --build --detach

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f
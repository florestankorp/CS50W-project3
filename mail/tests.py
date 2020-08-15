from django_seed import Seed

from mail.models import Email, User

SEEDER = Seed.seeder()
AMOUNT = 1
EMAILS = {
    "RON": "ron@hogwarts.com",
    "HERMIONE": "hermione@hogwarts.com",
    "HARRY": "harry@hogwarts.com",
    "FLO": "flo@hogwarts.com",
}


HERMIONE = User.objects.get(email=EMAILS["HERMIONE"])
RON = User.objects.get(email=EMAILS["RON"])
HARRY = User.objects.get(email=EMAILS["HARRY"])
FLO = User.objects.get(email=EMAILS["FLO"])

SEEDER.add_entity(Email, AMOUNT, {"user": RON, "sender": RON})
inserted_pks = SEEDER.execute()

# Quizos contract ~Rishabh Raizada
import smartpy as sp

class Quizos(sp.Contract):
    def __init__(self, address):
        self.init_type(sp.TRecord(admin = sp.TAddress, askAmt = sp.TMutez, voteAmt = sp.TMutez, ctr = sp.TNat, questions = sp.TMap(sp.TNat,sp.TPair(sp.TMutez,sp.TString)), voters = sp.TMap(sp.TNat, sp.TSet(sp.TPair(sp.TAddress, sp.TBool)))).layout((("admin", ("askAmt", "ctr")), ("questions", ("voteAmt", "voters")))))
        self.init(
        admin=address,
        askAmt=sp.tez(10),
        voteAmt=sp.tez(1),
        ctr=sp.nat(0),
        questions={},
        voters={}
        )

    @sp.entry_point
    def add_question(self, question):
        # Only Admin can trigger this function
        sp.verify_equal(sp.source, self.data.admin, message="Administrator not recognized.")
        # Admin should have atleast 'askAmt' in the wallet
        sp.verify(sp.amount >= self.data.askAmt, message="The administrator does not own enough tz.")
        # Add question to questions
        self.data.ctr+=1
        self.data.questions[self.data.ctr]=sp.pair(self.data.askAmt,question)

    @sp.entry_point
    def add_vote(self, questionId, answer):
        # Check if question is still open
        sp.verify(self.data.questions.contains(questionId), message="The question does not exist.")
        # Check if voter has 'voteAmt' in the wallet
        sp.verify(sp.amount == self.data.voteAmt, message="The sender did not send the right tez amount (1 tz).")
        # 1 person = 1 vote for a particular 'questionId'
        sp.if ~self.data.voters.contains(questionId):
            self.data.voters[questionId]=sp.set()

        sp.verify(~self.data.voters[questionId].contains(sp.pair(sp.sender,answer)), message="Each player can participate only once.")
        sp.verify(~self.data.voters[questionId].contains(sp.pair(sp.sender,~answer)), message="Each player can participate only once.")
        # Add voter to 'voters'
        self.data.voters[questionId].add(sp.pair(sp.sender,answer))
        # Increase prize pool 
        newPrizePool = self.data.voteAmt + sp.fst(self.data.questions[questionId]) 
        self.data.questions[questionId] = sp.pair(newPrizePool,sp.snd(self.data.questions[questionId]))

    @sp.entry_point
    def close_question(self, questionId, answer):
        # Only Admin can trigger this function
        sp.verify_equal(sp.source, self.data.admin, message="Administrator not recognized.")
        # Check if question is still open
        sp.verify(self.data.questions.contains(questionId), message="The question is closed.")
        # calculate winners, prizePool, prizePerWinner
        winners=0
        sp.for x in self.data.voters[questionId].elements():
            sp.if sp.snd(x) == answer:
                winners+=1
        prizePool = sp.fst(self.data.questions[questionId])
        # profitPerWinner = (prizePool - sp.mul(self.data.voteAmt,winners))/(2*winners)
        profitPerWinner = sp.split_tokens((prizePool - sp.mul(self.data.voteAmt,winners)),1,(2*winners))
        prizePerWinner = profitPerWinner + self.data.voteAmt
        # Distribute prize to winners
        sp.for x in self.data.voters[questionId].elements():
            sp.if sp.snd(x) == answer:
                sp.send(sp.fst(x),prizePerWinner, message="Couldn't send prize amount")
        # Remove question from the list
        del self.data.questions[questionId]
        del self.data.voters[questionId]

    @sp.entry_point
    def withdraw_profits(self):
        # Only Admin can trigger this function
        sp.verify_equal(sp.source, self.data.admin, message="Administrator not recognized.")
        # Verify if profits are atleast 1Tez
        sp.verify(sp.balance>=sp.tez(1), message="Not enough profits generated.")
        # withdraw profits till now
        sp.send(self.data.admin,sp.balance, message="Withdrawl unsuccessfull")

@sp.add_test(name="Quizos")
def test():
    alice = sp.test_account("Alice")
    jack = sp.test_account("Jack")
    admin = sp.test_account("Administrator")
    r = Quizos(admin.address)
    scenario = sp.test_scenario()
    scenario.h1("Quizos")
    scenario += r

    scenario.h2("Test add_question entrypoint")

    scenario.h3("The unauthorized user Alice unsuccessfully call add_question")
    scenario += r.add_question("Sample question").run(source=alice.address, amount=sp.tez(10), valid=False)

    scenario.h3("Admin unsuccessfully call add_question by sending not enough tez to the contract")
    scenario += r.add_question("Sample question1").run(source=admin.address, amount=sp.tez(9), valid=False)

    scenario.h3("Admin successfully call add_question")
    scenario += r.add_question("Sample question2").run(source=admin.address, amount=sp.tez(10))

    scenario.h2("Test add_vote entrypoint")

    scenario.h3("Alice unsuccessfully call add_vote by selecting non-existing question")
    scenario += r.add_vote(questionId=0,answer=True).run(sender=alice.address, amount=sp.tez(3), valid=False)
    
    scenario.h3("Alice unsuccessfully call add_vote by sending a wrong amount of tez")
    scenario += r.add_vote(questionId=1,answer=True).run(sender=alice.address, amount=sp.tez(3), valid=False)

    scenario.h3("Alice successfully call add_vote")
    scenario += r.add_vote(questionId=1,answer=True).run(sender=alice.address, amount=sp.tez(1))

    scenario.h3("Alice unsuccessfully call add_vote because she has already voted")
    scenario += r.add_vote(questionId=1,answer=False).run(sender=alice.address, amount=sp.tez(1), valid=False)

    scenario.h3("Jack successfully calls add_vote")
    scenario += r.add_vote(questionId=1,answer=False).run(sender=jack.address, amount=sp.tez(1))

    scenario.h2("Test close_question entrypoint")

    scenario.h3("The unauthorized user Alice unsuccessfully call close_question")
    scenario += r.close_question(questionId=1,answer=True).run(sender=alice.address, valid=False)

    scenario.h3("Admin unsuccessfully call close_question because question does not exist")
    scenario += r.close_question(questionId=0,answer=True).run(sender=admin.address, valid=False)

    scenario.h3("Admin successfully call close_question")
    scenario += r.close_question(questionId=1,answer=True).run(sender=admin.address)

    scenario.h3("Alice unsuccessfully call add_vote because the question is closed")
    scenario += r.add_vote(questionId=1,answer=True).run(sender=alice.address, amount=sp.tez(1), valid=False)

    #103,109,120
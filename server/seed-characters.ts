import { db } from "./db";
import { characters } from "@shared/schema";

const charactersData = [
  {
    rewardNumber: 1,
    title: "The earth destroyer",
    description: "You don't care at all about the environment, if everyone was like you the earth will be destroyed",
    maxAvailable: 1000000,
    tokenCost: 10,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeieiamcf26wwskph7gkwr32u4uzcvqpk6lueubwsek5yvqjdpsjj5e"
  },
  {
    rewardNumber: 2,
    title: "The climate change indifferent",
    description: "You prefer to adapt rather than fight. You choose the no action and let the circumstances get over you",
    maxAvailable: 100000,
    tokenCost: 50,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeictp6tuffh5klcwjpmiaw6v3lrr66db6abpop7n6mgefeuzodpoia"
  },
  {
    rewardNumber: 3,
    title: "The polluter",
    description: "The environment is not your priority, you throw rubbish all over it.",
    maxAvailable: 50000,
    tokenCost: 100,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeifof6tbzf4hzzb456wgkt4cqul6y7hug7tnznvtrkvfjczkikyw3y"
  },
  {
    rewardNumber: 4,
    title: "All you can eater",
    description: "You are starting caring about the earth, but you won't renunce to anything for it.",
    maxAvailable: 25000,
    tokenCost: 200,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeidfzesh2ahevhhqdpx6345oubwjmklfbgpljyc47lzzvdlsmqrzbi"
  },
  {
    rewardNumber: 5,
    title: "It's not my problem",
    description: "You live in a bubble, you know earth is in danger, but you prefer to continue doing your things",
    maxAvailable: 12500,
    tokenCost: 400,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeigdgfgjo2wzdc4jjsnirdihmtfhhu2neqnkn53irsrw4mohv343nq"
  },
  {
    rewardNumber: 6,
    title: "I care, but I don't",
    description: "You speak to people about climate change, you engage in discussions about it, but you will not stop buying products or traveling by plane",
    maxAvailable: 6250,
    tokenCost: 800,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeig6v333d4yar6pomrizfgasg55ya4o2i2zhavnnhg5gnwwgrii3s4"
  },
  {
    rewardNumber: 7,
    title: "The manifestant",
    description: "You participate to manifestations, you make people aware of climate change, but you still contribute to it",
    maxAvailable: 3000,
    tokenCost: 1600,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeiaah7oyvlwn32gaogi2ygjryzqhk5qj2j6xpxltws7nup3ij5hgua"
  },
  {
    rewardNumber: 8,
    title: "The fighter",
    description: "Actions are taken, you are the kind of person who acts. You put your efforts on changing things but still not at the maximum",
    maxAvailable: 1000,
    tokenCost: 3200,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeif6dpxpzugza47onapao42of4clquo4k3tsdczywlig7ybgorszse"
  },
  {
    rewardNumber: 9,
    title: "The planet lover",
    description: "You love your planet and you will make everything to save it, helping others realice that. You're still not 100% confident on the subject, but you're almost there",
    maxAvailable: 500,
    tokenCost: 6400,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeieqdmv3djocddnw7qjd42reogruvybnr5ctvgxm7jjmi2oegrndwy"
  },
  {
    rewardNumber: 10,
    title: "The ecoGOD",
    description: "The planet is still safe thank to the people like you. You engage in conversation, you are living a sustainable life, all your actions will be remembered. Well done ecoGOD!",
    maxAvailable: 250,
    tokenCost: 12800,
    ipfsLink: "https://blush-total-elk-215.mypinata.cloud/ipfs/bafybeib2qgk5twhfs2ya6npycut6uvfdelrbiv6afdoqjtwyuk2r5tluea"
  }
];

async function seedCharacters() {
  try {
    console.log("Seeding characters...");
    
    for (const character of charactersData) {
      await db.insert(characters).values(character).onConflictDoNothing();
    }
    
    console.log("Characters seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding characters:", error);
    process.exit(1);
  }
}

seedCharacters();

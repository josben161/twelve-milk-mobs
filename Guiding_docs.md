TwelveLabs Take Home
Notes on the case study:
● Working with AWS Account team who are selling to a large social media platform.
○ The buyer at the customer is the brand marketing campaign division
■ Their goal is to partner with well known brand names to create exciting and engaging campaigns on the platform
● The customer is creating a viral campaign that pays homage to the old “Got Milk” campaign from 1993.
○ Effective for millennials but want to focus on Gen Z.
○ Campaign encourages people to get creative and do something unique while drinking milk
○ The campaign launch will get started with a few celebrities/ influencers sharing their own vids
● The customer wants to be able to:
○ Identify when someone is taking part in the campaign
○ When users share videos on the platform they will include a tag #gotmilk, #milkmob with their post/ message.
○ From here, the customer wants to be able to auto validate the contents are related to got milk
○ Then segment users into Milk Mobs (video added to a collection of other users videos)
■ Focus on similar activities, locations, etc.
■ Become part of that “mob”
■ The users can explore similar mobs.
● Effectively this is Identify, Validate, Segment, explore
● Demo wants:
○ Use Twelvelabs API
○ Design and implement demo app that addresses your customers
○ Highlight TwelveLab’s role
○ Include detailed AWS arc (services consumed and impact on quota)
● Participation detection: Use Pegasus to detect “drinking milk” actions, milk containers, on-screen text, and spoken mentions; combine with hashtag presence from the post analysis app.
● Automatic validation: Require a confi dence threshold across modalities (visual, audio, OCR); the contextual ads/brand integration patterns already structure tags and scores.
Segment into “Milk Mobs”: Generate Marengo embeddings per video; cluster by activity (parkour-with-milk, latte-art, skate-with-milk), location (city landmarks), or vibe (funny/serious). The recommender app + tl-marengo-bedrock-s3 provide ready patterns for KNN and similarity exploration.
● Explore other videos in the mob: Serve nearest neighbors with timeline highlights; reuse highlight analyzer for “best moments” within each mob.

AWS architecture to show in the presentation
● Ingest + storage: CloudFront + S3 for uploads; media presigned URLs.
● Analysis: Lambda (Pegasus analyze via Bedrock) + Step Functions for async fan-out; EventBridge for status.
● Embeddings + search: Bedrock Marengo → vectors in DynamoDB/OpenSearch or S3-based vector store (as in tl-marengo-bedrock-s3).
● Validation service: API Gateway + Lambda to fuse hashtags with multimodal signals and return pass/fail + scores.
● Mob clustering: Batch job (Lambda/Glue) to cluster embeddings; store mob IDs and centroids in DynamoDB.
● Explore UI: Vercel/Next.js front end pulling mobs, members, highlights; Cognito for auth.
● Observability + quota: Bedrock usage metrics, S3/DDB costs, and SA-attached service consumption (Bedrock, Lambda, API Gateway, DDB, OpenSearch).
Build Plan:
Mono repo… split into frontend and backend. Frontend going to focus on creating two things:
1) Consumer facing to simulate a user - I suppose this means some sort of user profile does need to be handled This should look really good, like instagram.
2) Admin facing dashboard to monitor how the videos are being used. This should be a meta grade style for admin analysis.
It should all connect to an aws backend via an API. The frontend should be on vercel yes, but the backend should all be AWS services and all the handling should be done on AWS.


Partner Engineer Technical Exercise - ORIGINAL BRIEF 
Customer
You are working with an account team at AWS to enable them to sell to a large social media platform with a diverse range of users.
Use Case
The customer is part of the brand partnership marketing campaign division. Their goal is to partner with well-known brand names to create exciting and engaging campaigns within their social media platform.
Currently, the customer is creating a viral campaign that pays homage to the old “Got Milk” campaign from 1993 in an attempt to capitalize on the increasing effectiveness of nostalgia campaigns. Although the throwback is relevant to millennials, the goal is to broaden the campaign to draw in younger generations as well. The campaign encourages people to get creative and do something unique while drinking milk. The initial campaign launch will get started with a few celebrities/influencers sharing their own videos.
The customer wants to be able to identify when someone is taking part in the viral campaign. Ideally, when users share videos on the platform, they will include a unique tag (e.g. #gotmilk? #milkmob) with their post/message. From here, the customer wants to be able to automatically validate that the contents of the video the user is sharing are indeed related to the viral campaign. After the video is validated, the customer then wants to segment users into “Milk Mobs” where their shared video is added to a collection of other users’ videos that focus on similar activities, locations, etc. and they become a part of that “mob”. From here, the user can explore other users’ videos that are part of that mob as well.

Your Job
Using the TwelveLabs APIs (and whatever else you’d like 🙂) to create a demo application that addresses your customer’s needs highlighted above. You are free to design and implement a solution however you see fit to accomplish this!
You will present your solution to the AWS stakeholders on the customer side (some are technical, some are not) to highlight how TwelveLabs can help with this use case. In your presentation please include a detailed AWS architecture of the AWS services consumed and the impact that will have for the SA and Account team for their quota and goals.
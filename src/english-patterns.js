// ── English · sentence patterns ──
// A four-week plan of spoken chunks. Each pattern is practised as four variations
// (plain, negative or contrast, question, past or hedged) through ten sentences long
// enough to carry a real thought, so the chunk is learnt together with what follows it.
//
// The sentences are original, written in the register the source tag names — they are
// not quotations from any show or exam paper. Each example is [variation, 中文提示, English].
//
// Mon–Fri take the next pattern not yet finished, Saturday reviews the week, Sunday rests.
// Progress lives in the English log (see dashboard.js), so the plan follows what was
// actually practised, not the calendar: a missed day postpones a pattern, never skips it.

const EN_PATTERN_WEEKS = [
  { theme: '计划与打算', src: '美剧日常口语' },
  { theme: '经历与变化', src: '雅思口语 Part 1/2' },
  { theme: '观点与让步', src: '雅思 Part 3 · 托福口语' },
  { theme: '因果与假设', src: '托福 · 学术讨论' },
];

const EN_PATTERNS = [
  // ── Week 1 · 计划与打算 ──
  {
    title: 'be going to / gonna', zh: '打算、计划要做',
    note: '已经决定好的打算用 be going to；口语里常说成 gonna。临时起意更常用 will。',
    vars: [
      ["计划 + 接着做什么", "I'm gonna … and (then) …"],
      ["否定 + 直到 / 除非", "I'm not gonna … until / unless …"],
      ["问别人的打算", "Are you gonna …, or …?"],
      ["原本打算，但是", "I was gonna …, but …"],
    ],
    ex: [
      [0, '我今晚要看一下实验结果，再决定要不要换方法。', "I'm gonna check the experiment results tonight and decide whether I need to change the method."],
      [0, '这周末我要去看一个老朋友，估计会去她家附近那家店吃火锅。', "I'm going to visit an old friend this weekend, and we're probably gonna grab hotpot at that place near her apartment."],
      [0, '等这篇论文投出去，我要好好睡一觉，然后把拖了很久的房间收拾干净。', "Once this paper is submitted, I'm gonna sleep for like twelve hours and then finally clean up my room."],
      [1, '在拿到完整数据之前，我不会下任何结论。', "I'm not gonna draw any conclusions until I've got the full dataset."],
      [1, '除非导师明确要求，我不打算再改这张图了。', "I'm not going to touch this figure again unless my supervisor specifically asks me to."],
      [1, '这次我不会熬夜赶了，我打算每天写一点，提前一周交。', "I'm not gonna pull an all-nighter this time — I'm gonna write a little every day and hand it in a week early."],
      [2, '你今晚是要留下来加班，还是跟我们一起去吃饭？', "Are you gonna stay late tonight, or are you coming to dinner with us?"],
      [2, '如果审稿人还是不接受，你打算怎么办？', "What are you gonna do if the reviewers still don't buy it?"],
      [3, '我本来打算早点开始跑实验的，结果服务器一整天都被别人占着。', "I was gonna start the experiments early, but someone had the server tied up all day."],
      [3, '我原本想给你打电话的，但一忙起来就完全忘了，真不好意思。', "I was going to call you, but things got crazy and it totally slipped my mind — sorry about that."],
    ],
  },
  {
    title: "I'm thinking of / about doing", zh: '在考虑做某事（还没最终决定）',
    note: '比 be going to 更不确定，适合说还在权衡的事；of 和 about 基本可以互换。',
    vars: [
      ["考虑 + 原因", "I'm thinking of … because …"],
      ["在两个选择之间", "I'm thinking about …, or maybe …"],
      ["问对方的想法", "Have you thought about …? / Are you thinking of …?"],
      ["考虑过但放弃了", "I was thinking of …, but then …"],
    ],
    ex: [
      [0, '我在考虑换一个更小的模型，因为现在这个训练太慢了。', "I'm thinking of switching to a smaller model, because the current one takes forever to train."],
      [0, '我在考虑下学期去旁听一门统计课，补补基础。', "I'm thinking of sitting in on a stats course next semester to fill in some gaps in my background."],
      [0, '我在考虑搬到离学校近一点的地方，每天通勤太累了。', "I'm thinking about moving somewhere closer to campus, because the commute is really wearing me out."],
      [1, '我在想是先写方法部分，还是先把实验补完再说。', "I'm thinking about writing up the method section first, or maybe finishing the experiments before I write anything."],
      [1, '我在考虑暑假回家待两周，或者干脆留下来把论文赶完。', "I'm thinking about going home for two weeks this summer, or maybe just staying here and pushing the paper through."],
      [1, '我在考虑买台二手显示器，或者先借实验室那台凑合用。', "I'm thinking of getting a secondhand monitor, or maybe just borrowing the one in the lab for now."],
      [2, '你有没有想过把这部分工作单独写成一篇短文？', "Have you thought about turning this part into a short paper of its own?"],
      [2, '你是打算毕业后留在学术圈，还是去业界？', "Are you thinking of staying in academia after you graduate, or going into industry?"],
      [3, '我之前想过申请那个交换项目，但后来发现时间和组会冲突。', "I was thinking of applying for that exchange program, but then I realized it clashed with our group meetings."],
      [3, '我本来想自己从头实现，后来发现已经有现成的开源代码了。', "I was thinking of implementing it from scratch, but then I found there was already an open-source version."],
    ],
  },
  {
    title: 'be supposed to', zh: '按安排 / 按理应该',
    note: '说「本来安排好、本该如此」，常带一点「但实际没有」的意味；not supposed to 表示按规矩不该做。',
    vars: [
      ["安排好的事", "I'm supposed to … by / at …"],
      ["本该如此，但是", "… was supposed to …, but …"],
      ["按规矩不该", "You're not supposed to …"],
      ["问该怎么做", "How am I supposed to …? / Am I supposed to …?"],
    ],
    ex: [
      [0, '我应该周五前把修改稿发给导师，但现在还差两张图。', "I'm supposed to send the revised draft to my supervisor by Friday, and I've still got two figures to finish."],
      [0, '我下午三点要去参加组会，所以得在那之前把结果整理好。', "I'm supposed to be at the group meeting at three, so I need to get the results cleaned up before then."],
      [0, '这周应该轮到我做文献分享，我还没选好文章。', "It's supposed to be my turn to present a paper this week, and I haven't even picked one yet."],
      [1, '这个脚本本该十分钟跑完，结果跑了整整一个晚上。', "This script was supposed to finish in ten minutes, but it ran the entire night."],
      [1, '快递昨天就该到了，但到现在还显示在运输中。', "The package was supposed to arrive yesterday, but it's still showing as in transit."],
      [1, '这本来应该是个轻松的周末，结果被临时叫去改报告。', "This was supposed to be a relaxing weekend, but I got pulled in at the last minute to fix a report."],
      [2, '实验室里是不能吃东西的，尤其是在服务器旁边。', "You're not supposed to eat in the lab, especially not right next to the servers."],
      [2, '你不应该直接在原始数据上改，最好先复制一份。', "You're not supposed to edit the raw data directly — you should make a copy first."],
      [3, '他们什么说明都没给，我到底该怎么复现这个结果？', "They didn't give any instructions, so how am I supposed to reproduce this result?"],
      [3, '我是要在截止日期前提交全文，还是只交摘要就行？', "Am I supposed to submit the full paper before the deadline, or is the abstract enough?"],
    ],
  },
  {
    title: 'be about to', zh: '马上就要、正要',
    note: '比 be going to 更近，指「下一刻就要发生」；was just about to … when … 是讲故事的常用结构。',
    vars: [
      ["马上要做", "I'm about to …, so …"],
      ["正要…的时候", "I was just about to … when …"],
      ["提醒快发生了", "… is about to …, so you'd better …"],
      ["差点就", "I was about to …, but luckily …"],
    ],
    ex: [
      [0, '我马上要进会议了，有什么事我们晚点再聊行吗？', "I'm about to walk into a meeting, so can we talk about this a bit later?"],
      [0, '我正准备出门，你需要我顺路帮你带点什么吗？', "I'm about to head out — do you want me to grab anything for you on the way?"],
      [0, '实验马上要跑完了，所以我先不关电脑。', "The run is about to finish, so I'm gonna leave my laptop on for now."],
      [1, '我正准备提交，突然发现参考文献格式全错了。', "I was just about to hit submit when I noticed the reference format was completely wrong."],
      [1, '我正要睡觉，导师突然发消息问我明天能不能汇报。', "I was just about to go to bed when my supervisor messaged me asking if I could present tomorrow."],
      [1, '我刚要开口解释，他就已经把话题转走了。', "I was just about to explain when he changed the subject."],
      [2, '截止时间快到了，你最好先把能交的部分交上去。', "The deadline's about to hit, so you'd better submit whatever you've got."],
      [2, '电脑快没电了，你最好赶紧保存一下文件。', "Your battery's about to die, so you'd better save your work right now."],
      [3, '我差点把整个文件夹删了，幸好在最后一秒看到了提示。', "I was about to delete the whole folder, but luckily I caught the warning at the last second."],
      [3, '我当时都准备放弃这个方向了，结果一个小改动让结果好了很多。', "I was about to give up on this direction, but one small tweak made the results way better."],
    ],
  },
  {
    title: "I'd rather … than …", zh: '宁愿、更愿意',
    note: "I'd rather + 动词原形；than 后面也用原形。I'd rather you + 过去式，表示希望别人怎么做。",
    vars: [
      ["偏好 + 理由", "I'd rather … than …, because …"],
      ["委婉拒绝", "I'd rather not …, if that's okay."],
      ["问偏好", "Would you rather … or …?"],
      ["希望别人怎么做", "I'd rather you + 过去式 …"],
    ],
    ex: [
      [0, '我宁愿多花一周把实验做扎实，也不想仓促投稿然后被拒。', "I'd rather spend an extra week making the experiments solid than rush the submission and get rejected."],
      [0, '我宁愿早上六点起来写东西，也不想熬到半夜，因为早上脑子清楚多了。', "I'd rather get up at six to write than stay up till midnight, because my head is way clearer in the morning."],
      [0, '我宁愿自己做饭，也不想天天点外卖，又贵又不健康。', "I'd rather cook for myself than order takeout every day — it's expensive and not exactly healthy."],
      [1, '如果可以的话，我这次不太想上台讲，数据还没准备好。', "I'd rather not present this time, if that's okay — the data's not really ready yet."],
      [1, '这个我还是不在群里讨论了，我们私下聊吧。', "I'd rather not get into this in the group chat — let's talk about it one-on-one."],
      [1, '我今晚不太想出去，这周实在太累了。', "I'd rather not go out tonight, if you don't mind — it's been a really long week."],
      [2, '你是想今天把会开完，还是改到明天大家都在的时候？', "Would you rather get the meeting over with today, or push it to tomorrow when everyone's around?"],
      [2, '你更愿意做一个大项目，还是同时推进几个小项目？', "Would you rather work on one big project or juggle a few smaller ones at the same time?"],
      [3, '我倒希望你当时直接告诉我，而不是等我自己发现。', "I'd rather you had just told me straight away instead of letting me find out on my own."],
      [3, '这些改动我希望你先跟我说一声，再推到主分支上。', "I'd rather you checked with me first before pushing these changes to the main branch."],
    ],
  },

  // ── Week 2 · 经历与变化 ──
  {
    title: 'have been doing … for / since', zh: '一直在做（持续到现在）',
    note: '强调从过去持续到现在、还在继续；for + 时长，since + 起点。雅思 Part 1 回答「多久了」的万能结构。',
    vars: [
      ["一直在做 + 时长", "I've been … for …"],
      ["自从某件事以来", "I've been … ever since …"],
      ["问持续多久", "How long have you been …?"],
      ["最近一直 + 结果", "I've been … lately, and …"],
    ],
    ex: [
      [0, '这个模型我已经调了差不多三周了，还是不太稳定。', "I've been tuning this model for almost three weeks, and it's still not very stable."],
      [0, '我读博快两年了，现在才慢慢摸清怎么找研究问题。', "I've been doing my PhD for nearly two years, and I'm only now figuring out how to find a good research question."],
      [0, '我每天早上跑步已经坚持一个月了，睡眠明显好了很多。', "I've been running every morning for a month now, and I'm sleeping so much better."],
      [1, '自从换了新导师，我一直在补这个领域的基础文献。', "I've been catching up on the basic literature in this field ever since I switched supervisors."],
      [1, '自从上次服务器崩了之后，我每天都会备份数据。', "I've been backing up my data every single day ever since the server crashed last time."],
      [1, '自从搬到这边，我一直想找个能安静写东西的咖啡馆。', "I've been looking for a quiet café to write in ever since I moved here."],
      [2, '你做这个方向多久了？一开始是怎么入门的？', "How long have you been working in this area, and how did you get into it in the first place?"],
      [2, '你学英语学了多久了？有没有什么特别有用的方法？', "How long have you been learning English, and is there anything that's really worked for you?"],
      [3, '我最近一直在用 AI 帮我改英文邮件，确实省了不少时间。', "I've been using AI to polish my English emails lately, and it's honestly saved me a lot of time."],
      [3, '最近我一直睡得很晚，所以白天效率特别低。', "I've been going to bed really late lately, so I've been pretty unproductive during the day."],
    ],
  },
  {
    title: 'used to … but now …', zh: '以前（常常）…，现在…',
    note: '讲变化的核心句型。注意区分：used to do 以前常做；be / get used to doing 习惯于做。',
    vars: [
      ["以前 vs 现在", "I used to …, but now …"],
      ["以前不…", "I didn't use to …, but …"],
      ["习惯 / 逐渐习惯", "I'm (getting) used to …ing"],
      ["问以前", "Did you use to …?"],
    ],
    ex: [
      [0, '我以前觉得写论文最难的是英文，现在发现真正难的是把逻辑理清楚。', "I used to think the hardest part of writing a paper was the English, but now I realize it's getting the logic straight."],
      [0, '我以前每次组会前都特别紧张，现在基本能很自然地讲了。', "I used to get really nervous before every group meeting, but now I can pretty much just talk through my slides."],
      [0, '我以前周末都在宿舍躺着，现在会去爬山或者去图书馆。', "I used to spend my weekends lying around in my dorm, but now I go hiking or head to the library."],
      [1, '我以前不太喜欢喝咖啡，但读博以后每天至少两杯。', "I didn't use to like coffee at all, but since starting my PhD I have at least two cups a day."],
      [1, '我以前不怎么做计划，所以经常到最后一刻才赶。', "I didn't use to plan anything, so I was always rushing at the last minute."],
      [2, '我已经习惯每天先看一眼实验日志再开始工作。', "I'm used to checking my experiment log first thing before I start work."],
      [2, '我还在慢慢适应用英文开会，有时候还是跟不上。', "I'm still getting used to having meetings in English — sometimes I can't keep up."],
      [2, '刚开始我很不习惯这里的饮食，现在已经完全适应了。', "At first I wasn't used to the food here at all, but now I've totally gotten used to it."],
      [3, '你小时候是不是经常搬家？', "Did you use to move around a lot when you were a kid?"],
      [3, '你以前是不是也做过硬件相关的工作？', "Did you use to work on hardware stuff before you got into this?"],
    ],
  },
  {
    title: "It's been ages since …", zh: '距离上次…已经很久了',
    note: "It's been + 时长 + since + 过去式。口语里 ages 就是「好久」，也可以换成具体时长。",
    vars: [
      ["很久没做", "It's been ages since I last …"],
      ["具体时长 + 现状", "It's been + 时长 + since …, and …"],
      ["这么久以来第一次", "This is the first time I've … in …"],
      ["问上一次", "When was the last time you …?"],
    ],
    ex: [
      [0, '我已经好久没有好好放个假了，上一次还是去年春节。', "It's been ages since I had a proper break — the last one was Chinese New Year last year."],
      [0, '好久没跟本科同学聚了，大家现在都各忙各的。', "It's been ages since I hung out with my college friends — everyone's so busy with their own stuff now."],
      [0, '我好久没读过跟专业无关的书了，感觉视野都变窄了。', "It's been ages since I read a book that had nothing to do with my research, and I feel like my world's getting smaller."],
      [1, '这篇稿子投出去已经三个月了，到现在还没有任何消息。', "It's been three months since I submitted the manuscript, and I still haven't heard anything back."],
      [1, '上次改这段代码已经是两周前了，很多细节我都记不清了。', "It's been two weeks since I last touched this code, and I've already forgotten a lot of the details."],
      [1, '我开始练口语已经一个月了，现在至少敢开口了。', "It's been a month since I started working on my spoken English, and at least now I'm not afraid to open my mouth."],
      [2, '这是我这个月第一次在十二点前睡觉。', "This is the first time I've gone to bed before midnight this month."],
      [2, '这是我这几年来第一次觉得实验结果真的有意义。', "This is the first time in years I've felt like my results actually mean something."],
      [3, '你上一次一整天不看手机是什么时候？', "When was the last time you went a whole day without looking at your phone?"],
      [3, '你上次给家里打电话是什么时候？', "When was the last time you called your family?"],
    ],
  },
  {
    title: 'The first time I …', zh: '第一次…的时候',
    note: '雅思 Part 2 讲经历的好开头；Have you ever … 问经历；had never … until … 讲「直到那时才」。',
    vars: [
      ["第一次的经历", "The first time I …, I …"],
      ["第一次 vs 现在", "The first time I …, …; now …"],
      ["问有没有经历过", "Have you ever …?"],
      ["直到…才", "I'd never … until …"],
    ],
    ex: [
      [0, '我第一次在国际会议上做报告的时候，紧张到忘了翻页。', "The first time I gave a talk at an international conference, I was so nervous I forgot to change slides."],
      [0, '第一次收到审稿意见的时候，我盯着 major revision 那两个词看了很久。', "The first time I got reviewer comments back, I just stared at the words major revision for ages."],
      [0, '我第一次一个人出国的时候，转机时把行李弄丢了。', "The first time I traveled abroad on my own, I lost my luggage during a layover."],
      [1, '我第一次读这篇论文完全看不懂，现在回头看觉得思路其实挺清楚的。', "The first time I read this paper I couldn't follow it at all, but now the logic seems pretty clear."],
      [1, '第一次做饭的时候我差点把锅烧了，现在已经能请朋友来家里吃饭了。', "The first time I cooked, I nearly set the pan on fire, and now I actually have friends over for dinner."],
      [2, '你有没有遇到过代码明明没改、结果却突然变了的情况？', "Have you ever had your results suddenly change even though you didn't touch the code?"],
      [2, '你有没有试过在一个完全陌生的城市待一整个月？', "Have you ever spent a whole month in a city where you didn't know anyone?"],
      [2, '你有没有被导师当场问得答不上来过？', "Have you ever been put on the spot by your supervisor and had no idea what to say?"],
      [3, '直到自己带师弟师妹，我才意识到把事情讲清楚有多难。', "I'd never realized how hard it is to explain things clearly until I started mentoring junior students."],
      [3, '来这里之前，我从来没在这么冷的地方过过冬。', "I'd never spent a winter anywhere this cold until I moved here."],
    ],
  },
  {
    title: 'It turned out (that) …', zh: '结果发现、原来是',
    note: '讲「预期 vs 实际」的转折，讲故事和汇报排查过程都很常用；turn out to be + 名词 / 形容词。',
    vars: [
      ["原以为…结果", "I thought …, but it turned out …"],
      ["结果成了", "… turned out to be …"],
      ["问结果如何", "How did … turn out?"],
      ["比预期好 / 差", "It turned out better than …"],
    ],
    ex: [
      [0, '我以为是模型的问题，结果发现是数据预处理里有个 bug。', "I thought the problem was the model, but it turned out there was a bug in the data preprocessing."],
      [0, '我以为会议室都订满了，结果只是系统没刷新。', "I thought all the meeting rooms were booked, but it turned out the system just hadn't refreshed."],
      [0, '我还以为他在生我的气，结果他只是那天太累了。', "I thought he was mad at me, but it turned out he was just exhausted that day."],
      [1, '那个被我忽略的小特征，最后反而成了最关键的变量。', "That tiny feature I'd ignored turned out to be the most important variable."],
      [1, '本来只是随手做的对比实验，后来成了论文里最有说服力的部分。', "What started as a quick side experiment turned out to be the most convincing part of the paper."],
      [1, '那家看起来很普通的小店，原来是这附近最好吃的面馆。', "That ordinary-looking little shop turned out to be the best noodle place in the neighborhood."],
      [2, '你上周那个面试最后怎么样了？', "How did that interview last week turn out?"],
      [2, '你们换了新方法以后，结果怎么样？', "So how did things turn out after you switched to the new method?"],
      [3, '结果比我预期的好很多，审稿人只提了几个小问题。', "It turned out way better than I expected — the reviewers only raised a few minor points."],
      [3, '那次旅行虽然一路下雨，最后反而成了我印象最深的一次。', "Even though it rained the whole trip, it turned out to be the one I remember most."],
    ],
  },

  // ── Week 3 · 观点与让步 ──
  {
    title: 'It depends on …', zh: '要看…、取决于…',
    note: '雅思 Part 3 回答开放问题的起手式：先说取决于什么，再分两种情况展开，避免一句话答完。',
    vars: [
      ["看情况 + 分两种情形", "It depends on …. If …, …; but if …, …"],
      ["取决于是否", "It really depends on whether …"],
      ["追问取决于什么", "What does that depend on?"],
      ["很大程度上取决于", "… largely depends on …"],
    ],
    ex: [
      [0, '要看数据量。数据多的话深度模型更好；数据少的话，简单模型反而更稳。', "It depends on how much data you have. If there's plenty, deep models do better; but if it's limited, simpler models are actually more reliable."],
      [0, '看具体情况。如果只是小改动，我今天就能弄完；但如果要重跑实验，至少得一周。', "It depends. If it's just a small change, I can get it done today; but if I have to rerun the experiments, it'll take at least a week."],
      [0, '要看是什么工作。需要深度思考的我更喜欢在家做；需要讨论的还是去办公室好。', "It depends on the kind of work. If it needs deep focus, I'd rather be at home; but if there's a lot of discussion, the office is better."],
      [1, '我会不会继续做博后，很大程度上要看这两年能不能发出好文章。', "Whether I stay on as a postdoc really depends on whether I can publish some solid papers in the next two years."],
      [1, '周末去不去爬山，得看天气会不会转好。', "Whether we go hiking this weekend really depends on whether the weather clears up."],
      [1, '年轻人愿不愿意回老家发展，主要看那里有没有合适的机会。', "Whether young people move back to their hometowns really depends on whether there are decent opportunities there."],
      [2, '你说这个方法效果好，那它取决于哪些条件？', "You said the method works well — but what does that depend on?"],
      [2, '这个结论是不是也取决于你选的测试集？', "Does that conclusion depend on which test set you picked?"],
      [3, '一个人能不能坚持学习，很大程度上取决于有没有明确的目标。', "Whether someone sticks with learning largely depends on whether they have a clear goal."],
      [3, '研究的质量一部分取决于方法，但更多取决于问题本身选得好不好。', "The quality of research partly depends on the method, but it depends much more on whether you picked the right question."],
    ],
  },
  {
    title: 'The thing is, …', zh: '问题是、关键在于',
    note: '口语里引出真正的原因或难处，语气比 but 更自然；The point is 强调重点，The only thing is 指唯一的顾虑。',
    vars: [
      ["说出真正的原因", "I'd love to …. The thing is, …"],
      ["肯定之后指出问题", "… sounds great. The thing is, …"],
      ["强调重点", "…, but the point is (that) …"],
      ["唯一的顾虑", "…. The only thing is, …"],
    ],
    ex: [
      [0, '我很想接这个合作项目，问题是我手上已经有三个截止日期了。', "I'd love to take on this collaboration. The thing is, I've already got three deadlines coming up."],
      [0, '我也想早点睡，问题是一到晚上我的思路才特别清楚。', "I'd love to go to bed earlier. The thing is, that's exactly when my brain starts working properly."],
      [0, '我不是不想回消息，问题是我一专注起来就完全不看手机。', "It's not that I don't want to reply. The thing is, once I'm focused I don't look at my phone at all."],
      [1, '这个想法听起来很好，问题是我们没有足够的算力去验证它。', "That idea sounds great. The thing is, we don't have enough computing power to test it."],
      [1, '网课确实很方便，问题是很少有人能真正学完。', "Online courses are really convenient. The thing is, hardly anyone actually finishes them."],
      [1, '让学生自己选课题听起来很自由，问题是很多人一开始根本不知道该选什么。', "Letting students choose their own topics sounds liberating. The thing is, most of them have no idea what to choose at first."],
      [2, '我知道你已经很努力了，但关键是结果得能复现。', "I know you've put in a lot of work, but the point is the results need to be reproducible."],
      [2, '用哪个工具不重要，重要的是你能不能一直用下去。', "It doesn't matter which tool you use — the point is whether you actually keep using it."],
      [3, '这间公寓各方面都挺好，唯一的问题是离地铁有点远。', "The apartment is great in pretty much every way. The only thing is, it's a bit far from the subway."],
      [3, '这个方案我基本同意，唯一的顾虑是时间可能来不及。', "I basically agree with the plan. The only thing is, I'm not sure we'll have enough time."],
    ],
  },
  {
    title: 'Even though …, …', zh: '尽管、虽然…但仍然',
    note: 'even though 后接从句（不再加 but）；despite / in spite of 后接名词；even if 是假设性的「即使」。',
    vars: [
      ["尽管 + 仍然", "Even though …, I still …"],
      ["句末 though 补一句", "…. …, though."],
      ["despite + 名词", "Despite / In spite of …, …"],
      ["即使（假设）", "Even if …, …"],
    ],
    ex: [
      [0, '虽然这个方法在论文里效果很好，我在自己的数据上还是没复现出来。', "Even though the method looked great in the paper, I still couldn't reproduce it on my own data."],
      [0, '尽管每天都很忙，我还是尽量抽二十分钟练口语。', "Even though I'm swamped every day, I still try to find twenty minutes to practice speaking."],
      [0, '虽然这次被拒了，但审稿意见其实给了我很多有用的方向。', "Even though the paper got rejected, the reviews actually gave me a lot of useful direction."],
      [1, '这个结果挺有意思的，不过我不确定能不能推广到其他设备上。', "The result is pretty interesting. I'm not sure it generalizes to other machines, though."],
      [1, '这次旅行很累，不过真的很值得。', "The trip was exhausting. It was totally worth it, though."],
      [2, '尽管样本量很小，这个趋势还是相当明显的。', "Despite the small sample size, the trend is still pretty clear."],
      [2, '尽管遇到了不少技术问题，项目还是按时交付了。', "In spite of all the technical issues, the project was still delivered on time."],
      [3, '就算这次没中，我也会根据意见改完再投别的期刊。', "Even if it doesn't get accepted this time, I'll revise it based on the comments and send it somewhere else."],
      [3, '即使 AI 工具能做很多事，研究者还是得自己判断结果靠不靠谱。', "Even if AI tools can do a lot, researchers still have to judge for themselves whether the results make sense."],
      [3, '就算明天下雨，我们也可以改去博物馆，不用取消。', "Even if it rains tomorrow, we can just go to the museum instead — no need to cancel."],
    ],
  },
  {
    title: "I'm not saying …, but …", zh: '我不是说…，只是…',
    note: '表达不同意见时先缓和语气，再说重点。讨论、组会、托福小组讨论都很好用。',
    vars: [
      ["缓和地提意见", "I'm not saying …, but …"],
      ["不是不…，只是", "It's not that …, it's just that …"],
      ["别误会", "Don't get me wrong, …"],
      ["书面：这并不是说", "That's not to say …"],
    ],
    ex: [
      [0, '我不是说你的方法不对，只是我觉得还需要再加一个对照实验。', "I'm not saying your approach is wrong, but I think we need one more control experiment."],
      [0, '我不是说要放弃这个方向，只是我们得先证明它值得继续做。', "I'm not saying we should drop this direction, but we need to show it's worth pursuing first."],
      [0, '我不是说线上开会不好，只是有些问题当面讲清楚快得多。', "I'm not saying online meetings are bad, but some things are just way faster to sort out face to face."],
      [1, '我不反对用大模型，只是担心大家会不再自己思考。', "It's not that I'm against using large language models, it's just that I worry people will stop thinking for themselves."],
      [1, '我不是不想参加聚会，只是这周真的抽不出时间。', "It's not that I don't want to come to the party, it's just that I really can't find the time this week."],
      [2, '别误会，我很喜欢这份工作，只是有时候压力实在太大了。', "Don't get me wrong, I really like this job — it's just that the pressure gets pretty intense sometimes."],
      [2, '别误会，我不是在抱怨，我只是想让流程更清楚一点。', "Don't get me wrong, I'm not complaining — I just want the process to be a bit clearer."],
      [2, '别误会，这篇论文写得很好，只是实验部分还可以更扎实。', "Don't get me wrong, the paper is well written; the experiments could just be a bit more solid."],
      [3, '这并不是说理论不重要，而是理论最终还是要落到实际问题上。', "That's not to say theory doesn't matter; it's that theory eventually has to connect to real problems."],
      [3, '这并不意味着传统方法已经过时，数据少的时候它们依然很有用。', "That's not to say traditional methods are outdated — they're still really useful when data is limited."],
    ],
  },
  {
    title: 'What really matters is …', zh: '真正重要的是',
    note: '用 what 从句做主语来强调重点；It is not … that matters 是对比强调；The key is to … 给方法。',
    vars: [
      ["真正重要的是", "What really matters is …"],
      ["重要的不是…而是", "It's not … that matters, it's …"],
      ["关键是要", "The key (to …) is to …"],
      ["我最在意的是", "What I care about most is …"],
    ],
    ex: [
      [0, '发多少文章不是重点，真正重要的是你有没有解决一个真问题。', "The number of papers isn't the point — what really matters is whether you've solved a real problem."],
      [0, '学语言的时候，真正重要的是每天都用，哪怕只用一点点。', "When you're learning a language, what really matters is using it every day, even just a little."],
      [0, '找工作时，我觉得最重要的是团队氛围，而不只是薪水。', "When I'm looking for a job, what matters most to me is the team, not just the salary."],
      [1, '重要的不是你的模型多复杂，而是你能不能解释它为什么有效。', "It's not how complicated your model is that matters, it's whether you can explain why it works."],
      [1, '重要的不是你每天学多久，而是你能不能坚持下去。', "It's not how many hours you study each day that matters, it's whether you keep it up."],
      [2, '写引言的关键是一开始就让读者知道你要解决什么问题。', "The key with an introduction is to tell the reader right away what problem you're solving."],
      [2, '要保持工作和生活的平衡，关键是给自己划清下班的界线。', "The key to keeping a work-life balance is to draw a clear line for when your workday ends."],
      [2, '和导师沟通的关键是先给结论，再讲细节。', "The key when you talk to your supervisor is to give the conclusion first and the details after."],
      [3, '对我来说，最在意的是做出来的东西真的有人用。', "For me, what I care about most is that what I build actually gets used by someone."],
      [3, '选城市的时候我最看重的是生活节奏，而不是城市有多大。', "What I care about most when picking a city is the pace of life, not how big the place is."],
    ],
  },

  // ── Week 4 · 因果与假设 ──
  {
    title: 'If I had …, I would have …', zh: '要是当时…就会…（与过去事实相反）',
    note: 'If + had done, would have done 表示对过去的假设；I wish I had done 表示遗憾；should have done 表示本该。',
    vars: [
      ["要是当时…就会", "If I had …, I would(n't) have …"],
      ["真希望当时", "I wish I had …"],
      ["本应该", "I should have …, then …"],
      ["过去的选择 → 现在的结果", "If I had …, I would … now"],
    ],
    ex: [
      [0, '要是我早点做消融实验，审稿时就不会这么被动了。', "If I had run the ablation study earlier, I wouldn't have been caught off guard during the review."],
      [0, '要是那天我多检查一遍，就不会把错误的版本发给导师了。', "If I had double-checked that day, I wouldn't have sent the wrong version to my supervisor."],
      [0, '要是早知道这门课这么有用，我本科就会认真学了。', "If I had known how useful this course would be, I would have taken it seriously as an undergrad."],
      [1, '真希望我读博第一年就养成记实验日志的习惯。', "I wish I had started keeping an experiment log in my first year."],
      [1, '真希望那天我直接开口问了，而不是自己瞎琢磨一下午。', "I wish I had just asked that day instead of spending the whole afternoon figuring it out on my own."],
      [2, '我应该早点备份的，那样就不用重跑两天的实验了。', "I should have backed everything up earlier — then I wouldn't have had to rerun two days of experiments."],
      [2, '我当时应该先读一下文档的，很多坑其实写得清清楚楚。', "I should have read the documentation first — most of those issues were spelled out right there."],
      [2, '我们本应该提前订票的，现在只剩特别贵的航班了。', "We should have booked the tickets earlier — now there are only really expensive flights left."],
      [3, '要是我当初选了另一个题目，现在可能已经毕业了。', "If I had picked the other topic back then, I'd probably have graduated by now."],
      [3, '要是那时候多锻炼身体，现在也不至于坐一会儿就腰疼。', "If I had exercised more back then, my back wouldn't hurt every time I sit for a while now."],
    ],
  },
  {
    title: "That's why …", zh: '这就是为什么、所以',
    note: "先说事实，再用 That's why 引出结果；The reason … is that … 是更正式的解释；That's because 反过来引出原因。",
    vars: [
      ["事实 → 所以", "…, and that's why …"],
      ["之所以…是因为", "The reason … is that …"],
      ["那是因为（引出原因）", "…, but that's because …"],
      ["恍然大悟 / 确认原因", "So that's why …? / Is that why …?"],
    ],
    ex: [
      [0, '这个数据集噪声特别大，这就是为什么我们要先做平滑处理。', "This dataset is really noisy, and that's why we smooth it before doing anything else."],
      [0, '我早上效率最高，所以我把最难的任务都放在上午。', "I'm most productive in the morning. That's why I put all the hardest tasks before lunch."],
      [0, '他之前在业界干过几年，所以他提的问题总是特别实际。', "He spent a few years in industry, and that's why his questions are always so practical."],
      [1, '我选这个课题的原因是，它能直接用在真实的设备维护上。', "The reason I chose this topic is that it can be applied directly to real equipment maintenance."],
      [1, '很多人放弃学英语的原因是，他们一直在学却从来不用。', "The reason a lot of people give up on English is that they keep studying it but never actually use it."],
      [1, '这个模型表现差，主要原因是训练数据和测试数据分布不一样。', "The main reason the model performs poorly is that the training and test data come from different distributions."],
      [2, '结果之所以这么好，是因为测试集里混进了训练数据。', "The results look this good, but that's because some training data leaked into the test set."],
      [2, '我最近总是很累，其实是因为晚上一直在刷手机。', "I've been tired all the time lately, but that's because I keep scrolling on my phone at night."],
      [3, '原来你昨天没来组会是因为这个啊。', "Oh, so that's why you missed the group meeting yesterday."],
      [3, '你们是因为数据太少才换成迁移学习的吗？', "Is that why you switched to transfer learning — because there wasn't enough data?"],
    ],
  },
  {
    title: 'As long as …', zh: '只要…就',
    note: '表示条件；主句用将来或现在时，as long as 从句用现在时。unless 是「除非」，provided that 是书面的「前提是」。',
    vars: [
      ["只要…就", "As long as …, …"],
      ["我不介意，只要", "I don't mind …, as long as …"],
      ["除非", "…, unless …"],
      ["书面：前提是", "…, provided that …"],
    ],
    ex: [
      [0, '只要主要结论站得住，这些小问题都可以在修改稿里补上。', "As long as the main conclusion holds up, we can fix these small issues in the revision."],
      [0, '只要每天坚持一点点，三个月后你的口语一定会有明显变化。', "As long as you keep at it a little every day, your speaking will be noticeably different in three months."],
      [0, '只要不下大雨，我们周六就按原计划去露营。', "As long as it doesn't pour, we're still going camping on Saturday like we planned."],
      [1, '我不介意偶尔周末加班，只要平时能灵活安排时间就行。', "I don't mind working the occasional weekend, as long as I can be flexible during the week."],
      [1, '你用我的代码没关系，只要在论文里注明出处就好。', "I don't mind you using my code, as long as you cite it in your paper."],
      [1, '我不在乎房子小一点，只要安静、离学校近就行。', "I don't mind a smaller place, as long as it's quiet and close to campus."],
      [2, '我们下周应该能投出去，除非投稿系统又出问题。', "We should be able to submit next week, unless the submission system acts up again."],
      [2, '你不用专门过来，除非你想当面看一下结果。', "You don't need to come in, unless you want to see the results in person."],
      [3, '参与者的记录可以用于后续研究，前提是数据完全匿名化。', "The participants' records can be used in follow-up studies, provided that the data is fully anonymized."],
      [3, '这种方法可以推广到其他设备，前提是传感器的采样频率一致。', "The method can be extended to other machines, provided that the sensors use the same sampling rate."],
    ],
  },
  {
    title: 'The more …, the more …', zh: '越…越…',
    note: '两个比较级并列；形容词可用 -er 形式（the bigger, the better）；越来越用 more and more / -er and -er。',
    vars: [
      ["越…越…", "The more …, the more …"],
      ["-er 比较级", "The -er …, the -er …"],
      ["越多…越少", "The more …, the less …"],
      ["越来越", "… -er and -er / more and more …"],
    ],
    ex: [
      [0, '这个问题我研究得越深，就越觉得之前的假设太简单了。', "The more I dig into this problem, the more I realize my earlier assumptions were too simple."],
      [0, '你练得越多，真正开口的时候就越不紧张。', "The more you practice, the more relaxed you'll feel when you actually have to speak."],
      [0, '那封邮件我越拖着不回，就越怕去面对它。', "The more I put off answering that email, the more I dread dealing with it."],
      [1, '模型越大，需要的数据越多，训练成本也越高。', "The bigger the model, the more data it needs and the higher the training cost."],
      [1, '问题暴露得越早，后面修起来就越省事。', "The earlier you catch a problem, the cheaper it is to fix later on."],
      [1, '会开得越短越好，最好十五分钟内说清楚。', "The shorter the meeting, the better — ideally we sort it out in fifteen minutes."],
      [2, '我刷手机的时间越多，真正专注的时间就越少。', "The more time I spend on my phone, the less time I actually spend focused."],
      [2, '解释得越复杂，读者就越难抓住重点。', "The more complicated your explanation gets, the less likely readers are to get the main point."],
      [3, '这个领域的竞争越来越激烈，好的想法很快就会被别人做出来。', "Competition in this field is getting fiercer and fiercer — good ideas get picked up by someone else really fast."],
      [3, '越来越多的人用 AI 辅助写作，但怎样规范使用还没有定论。', "More and more people are using AI to help them write, but there's still no consensus on how to use it responsibly."],
    ],
  },
  {
    title: "It's worth …ing", zh: '值得做某事',
    note: "It's worth + doing；… is worth it 表示「值得」；not worth 表示「不值得」。",
    vars: [
      ["值得做 + 理由", "It's (really) worth …ing, because …"],
      ["不值得，如果", "It's not worth …ing if …"],
      ["问值不值得", "Is it worth …ing? / Is … worth it?"],
      ["事后觉得值了", "…, but it was (totally) worth it."],
    ],
    ex: [
      [0, '这篇综述很值得花时间精读，它把整个领域的脉络理得很清楚。', "This review is really worth reading carefully — it lays out how the whole field fits together."],
      [0, '早点学会用版本控制非常值得，它能帮你省掉无数次返工。', "It's worth learning version control early, because it'll save you from redoing work over and over."],
      [0, '这家店虽然要排队，但早餐真的值得等。', "There's always a line at this place, but the breakfast is honestly worth waiting for."],
      [1, '如果只提升零点一个百分点，就不值得再花一周去调参。', "If it only improves things by 0.1 percent, it's not worth spending another week tuning."],
      [1, '为了一个小型研讨会专门飞过去，感觉不太值得。', "It's not really worth flying all the way there just for a small workshop."],
      [2, '你觉得为了这个实验专门买一张新显卡值得吗？', "Do you think it's worth buying a new GPU just for this experiment?"],
      [2, '现在再去学一门新的编程语言，还值得吗？', "Is it still worth picking up a new programming language at this point?"],
      [2, '花钱报一个口语陪练，你觉得值不值？', "Do you think paying for a speaking coach is worth it?"],
      [3, '连熬两个通宵很累，但看到论文被接收的那一刻觉得都值了。', "Pulling two all-nighters was brutal, but when the paper got accepted it all felt worth it."],
      [3, '搬到学校附近房租贵了不少，但省下的通勤时间完全值得。', "Moving closer to campus costs a lot more in rent, but the time I save on commuting is totally worth it."],
    ],
  },
];

// Week (0-based) a pattern belongs to: five per week.
const enPatternWeek = i => Math.floor(i / 5);

// The practice log line for a pattern: "- Day 3 · 句型 · be going to / gonna · 4/10 · ✓".
const EN_PATTERN_TAG = '句型';
const EN_REVIEW_TAG = '句型复习';
function enPatternHead(dayNo, tag, title, count, done) {
  return '- Day ' + dayNo + ' · ' + tag + ' · ' + title + ' · ' + count + '/10' + (done ? ' · ✓' : '');
}
function enParsePatternHead(line) {
  const m = String(line).match(/^- Day \d+ · (句型复习|句型) · (.+?) · (\d+)\/10( · ✓)?\s*$/);
  return m ? { tag: m[1], title: m[2], count: +m[3], done: !!m[4] } : null;
}

// One practised sentence, kept under its pattern's head line: "  - 中文 → English".
function enPatternSentence(zh, en) { return '  - ' + zh + ' → ' + en; }
function enParsePatternSentence(line) {
  const m = String(line).match(/^\s+- (.+?) → (.+)$/);
  return m ? { zh: m[1], en: m[2] } : null;
}

// Sorted log days (newest first, as enAllDays returns them) → which patterns are finished and when.
function enPatternProgress(days) {
  const doneOn = new Map();
  for (const d of days) for (const l of d.lines) {
    const h = enParsePatternHead(l);
    if (h && h.tag === EN_PATTERN_TAG && h.done) {
      const i = EN_PATTERNS.findIndex(p => p.title === h.title);
      if (i >= 0 && (!doneOn.has(i) || doneOn.get(i) > d.date)) doneOn.set(i, d.date);
    }
  }
  return doneOn;
}

// Small deterministic shuffle, so a review day shows the same sentences on every redraw.
function enSeeded(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

// What today is for: { mode: 'new' | 'review' | 'rest', idx, round, review: [[patternIdx, exampleIdx]] }.
// `days` is the English log, `date` is YYYY-MM-DD.
function enPatternPlan(days, date) {
  const doneOn = enPatternProgress(days);
  // Today's own finished pattern stays on screen for the rest of the day.
  const finishedToday = [...doneOn].find(([, d]) => d === date);
  let idx = finishedToday ? finishedToday[0] : EN_PATTERNS.findIndex((_, i) => !doneOn.has(i));
  let round = 1;
  if (idx < 0) {
    // All done: go round again, starting from the one practised longest ago.
    round = 2;
    idx = [...doneOn].sort((a, b) => a[1].localeCompare(b[1]))[0][0];
  }
  const dow = (new Date(date + 'T12:00').getDay() + 6) % 7;
  if (dow === 6) return { mode: 'rest', idx, round, review: [] };
  if (dow === 5) {
    const weekAgo = new Date(date + 'T12:00'); weekAgo.setDate(weekAgo.getDate() - 6);
    const from = weekAgo.getFullYear() + '-' + String(weekAgo.getMonth() + 1).padStart(2, '0') + '-' + String(weekAgo.getDate()).padStart(2, '0');
    const recent = [...doneOn].filter(([, d]) => d >= from && d < date).map(([i]) => i).sort((a, b) => a - b);
    if (recent.length) {
      const pool = [];
      for (const i of recent) EN_PATTERNS[i].ex.forEach((_, k) => pool.push([i, k]));
      const rnd = enSeeded(date);
      for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
      return { mode: 'review', idx, round, review: pool.slice(0, 10) };
    }
  }
  return { mode: 'new', idx, round, review: [] };
}

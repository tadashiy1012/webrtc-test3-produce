const id = Math.floor(Math.random() * 1000);

console.log(id);

let pclist = {};

const ws = new WebSocket('wss://cloud.achex.ca');
ws.onopen = () => {
    console.log('ws open');
    const auth = {auth: 'default@890', passowrd: '19861012'};
    ws.send(JSON.stringify(auth));
};
ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    if (data.id && data.id !== id) {
        console.log(ev, data);
        const pc = pclist[data.id] || makePc(data.id);
        console.log(pc);
        if (data.offer) {
            const offer = new RTCSessionDescription({
                type: 'offer',
                sdp: data.offer
            });
            (async () => {
                await pc.setRemoteDescription(offer);
                console.log('set remote desc');
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                const json = {id, answer, toId: data.id, to: 'default@890'};
                ws.send(JSON.stringify(json));
                console.log('send answer');
            })();
        }
        if (data.candidate) {
            const candidate = new RTCIceCandidate({
                candidate: data.candidate.candidate,
                sdpMLineIndex: data.candidate.sdpMLineIndex,
                sdpMid: data.candidate.sdpMid
            });
            (async () => {
                await pc.addIceCandidate(candidate);
                console.log('add ice candidate');
            })();
        }
    }
};

function makePc(tgtId) {
    const pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.services.mozilla.com:3478'}]
    });
    pc.onicecandidate = (ev) => {
        console.log(ev);
        if (ev.candidate) {
            const sdp = pc.localDescription.sdp;
            const json = {id, toId: tgtId, candidate: ev.candidate, sdp, to: 'default@890'};
            ws.send(JSON.stringify(json));
            console.log('send candidate:' + tgtId);
        }
    };
    pc.onicegatheringstatechange = (ev) => {
        console.log(ev.currentTarget.iceGatheringState)
    };
    pc.ondatachannel = (ev) => {
        console.log(ev);
    };
    pclist[id] = pc;
    return pc;
}

const idElm = document.getElementById('id');
idElm.innerHTML = id;
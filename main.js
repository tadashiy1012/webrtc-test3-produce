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
        console.log(ev);
        if (data.candidate) {
            const pc = pclist[data.id] || makePc(data.id);
            console.log(pc);
            const candidate = new RTCIceCandidate({
                candidate: data.candidate.candidate,
                sdpMLineIndex: data.candidate.sdpMLineIndex,
                sdpMid: data.candidate.sdpMid
            });
            if (!pc.remoteDescription) {
                const offer = new RTCSessionDescription({
                    type: 'offer',
                    sdp: data.sdp
                });
                (async () => {
                    await pc.setRemoteDescription(offer);
                    await pc.addIceCandidate(candidate);
                    console.log('set remote desc');
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    const json = {id, answer, toId: data.id, to: 'default@890'};
                    ws.send(JSON.stringify(json));
                    console.log('send answer');
                })();
            } else {
                (async () => {
                    await pc.addIceCandidate(candidate);
                    console.log('add ice candidate');
                })();
            }
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
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'plot_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({Key? key}) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late IO.Socket _socket;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, String>> _messages = [];
  bool _isChatStarted = false;

  @override
  void initState() {
    super.initState();
    _initializeSocket();
  }

  void _initializeSocket() {
    final String socketUrl = dotenv.env['SOCKET_URL'] ?? 'http://localhost:3000';
    _socket = IO.io(
      socketUrl,
      IO.OptionBuilder().setTransports(['websocket']).build(),
    );

    _socket.onConnect((_) {
      print('Connected to server');
    });

    _socket.on('message', (data) {
      setState(() {
        _messages.add({'role': data['role'], 'content': data['content']});
        _scrollToBottom();
      });
    });

    _socket.onDisconnect((_) {
      print('Disconnected from server');
    });
  }

  @override
  void dispose() {
    _socket.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  void _startChat() {
    _socket.emit('message', {'action': 'start'});
    setState(() {
      _isChatStarted = true;
      _messages.clear(); // Clear previous messages
    });
  }

  void _sendMessage() {
    if (_messageController.text.isNotEmpty) {
      _socket.emit('message', {
        'action': 'chat',
        'message': _messageController.text,
      });
      setState(() {
        _messages.add({'role': 'user', 'content': _messageController.text});
        _messageController.clear();
        _scrollToBottom();
      });
    }
  }

  void _endChat() {
    _socket.emit('message', {'action': 'end'});
    setState(() {
      _isChatStarted = false; // Reset the chat state
      _messages.clear(); // Clear all messages
    });
  }

  Widget _buildChatBubble(Map<String, String> message, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7, // Limit bubble width
        ),
        margin: const EdgeInsets.symmetric(
          vertical: 4.0,
          horizontal: 8.0,
        ),
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: isUser ? Colors.green[200] : Colors.blue[200],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12.0),
            topRight: const Radius.circular(12.0),
            bottomLeft: isUser ? const Radius.circular(12.0) : const Radius.circular(0),
            bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(12.0),
          ),
        ),
        child: Text(
          message['content'] ?? '',
          style: const TextStyle(fontSize: 16.0),
          softWrap: true, // Allow text to wrap
          overflow: TextOverflow.visible, // Ensure long text doesn't truncate
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Chat"),
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart),
            tooltip: 'View Symptom Plots',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const PlotScreen()),
              );
            },
          ),
        ],
      ),
      body: !_isChatStarted
          ? Center(
        child: ElevatedButton(
          onPressed: _startChat,
          child: const Text("Start Chat"),
        ),
      )
          : Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isUser = message['role'] == 'user';
                return _buildChatBubble(message, isUser);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    maxLines: null, // Allows input to grow to multiple lines
                    decoration: InputDecoration(
                      hintText: "Type your message...",
                      contentPadding: const EdgeInsets.all(12.0),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _endChat,
                  child: const Text("End Chat"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
